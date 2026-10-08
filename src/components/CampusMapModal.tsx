import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  MapPin,
  Search,
  Navigation,
  Building2,
  Compass,
  Phone,
  User,
  ChevronRight,
  Footprints,
  Clock,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  calculateCampusRouteApi,
  getCampusDestinationsApi,
  getCampusTopologyApi,
  CampusRouteResponse,
} from "../api/student.api";

export interface CampusLocation {
  id: string;
  name: string;
  category: "academic" | "lab" | "admin" | "amenity";
  buildingCode: string;
  floor: string;
  hodOrIncharge: string;
  phone: string;
  description: string;
  landmark: string;
  rooms: string[];
  color: string;
  bg: string;
  nodeId: string;
  lat: number;
  lng: number;
}

const CAMPUS_GRAPH_CACHE_KEY = "@holkar_campus_graph_cache";

// Local Dijkstra Algorithm for Offline Routing
function calculateOfflineDijkstraRoute(
  startNodeId: string,
  destinationNodeId: string,
  nodes: any[],
  paths: any[],
): CampusRouteResponse | null {
  if (startNodeId === destinationNodeId) {
    const node = nodes.find((n) => n.id === startNodeId);
    if (!node) return null;
    return {
      totalDistanceMeters: 0,
      estimatedWalkMinutes: 0,
      wheelchairAccessible: true,
      startNode: {
        id: node.id,
        nodeCode: node.nodeCode || node.id,
        name: node.name || node.id,
        latitude: Number(node.latitude),
        longitude: Number(node.longitude),
      },
      destinationNode: {
        id: node.id,
        nodeCode: node.nodeCode || node.id,
        name: node.name || node.id,
        latitude: Number(node.latitude),
        longitude: Number(node.longitude),
      },
      steps: [
        {
          stepNumber: 1,
          instruction: "You are already at your destination.",
          pathName: "Arrival",
          pathType: "PEDESTRIAN",
          distanceMeters: 0,
          fromNode: startNodeId,
          toNode: destinationNodeId,
        },
      ],
    };
  }

  // Build adjacency graph
  const adj = new Map<
    string,
    Array<{ to: string; distance: number; path: any }>
  >();
  for (const p of paths) {
    if (p.status && p.status !== "ACTIVE" && p.status !== "PUBLISHED") continue;
    const u = p.fromNodeId || p.from_node_id;
    const v = p.toNodeId || p.to_node_id;
    const rawDist = p.distanceMeters ?? p.distance_meters;
    if (rawDist === undefined || rawDist === null || isNaN(Number(rawDist)))
      continue;
    const dist = Number(rawDist);
    const isBi = p.isBidirectional ?? p.is_bidirectional ?? true;

    if (!u || !v) continue;

    if (!adj.has(u)) adj.set(u, []);
    adj.get(u)!.push({ to: v, distance: dist, path: p });

    if (isBi) {
      if (!adj.has(v)) adj.set(v, []);
      adj.get(v)!.push({ to: u, distance: dist, path: p });
    }
  }

  // Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<
    string,
    { node: string; path: any; distance: number }
  >();
  const visited = new Set<string>();

  for (const n of nodes) {
    distances.set(n.id, Infinity);
  }
  distances.set(startNodeId, 0);

  const pq: Array<{ id: string; dist: number }> = [
    { id: startNodeId, dist: 0 },
  ];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const curr = pq.shift()!;
    if (curr.id === destinationNodeId) break;
    if (visited.has(curr.id)) continue;
    visited.add(curr.id);

    const neighbors = adj.get(curr.id) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;
      const newDist = curr.dist + edge.distance;
      if (newDist < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, newDist);
        previous.set(edge.to, {
          node: curr.id,
          path: edge.path,
          distance: edge.distance,
        });
        pq.push({ id: edge.to, dist: newDist });
      }
    }
  }

  if (!previous.has(destinationNodeId) && startNodeId !== destinationNodeId) {
    return null;
  }

  // Backtrack
  const pathSteps: any[] = [];
  let curr = destinationNodeId;
  let totalDistance = 0;
  let isWheelchair = true;

  while (curr !== startNodeId) {
    const prev = previous.get(curr);
    if (!prev) break;
    totalDistance += prev.distance;
    if (prev.path?.isWheelchairAccessible === false) isWheelchair = false;

    const fromNodeObj = nodes.find((n) => n.id === prev.node);
    const toNodeObj = nodes.find((n) => n.id === curr);

    pathSteps.unshift({
      fromNode: prev.node,
      toNode: curr,
      distanceMeters: Math.round(prev.distance),
      pathName:
        prev.path?.pathName ||
        prev.path?.name ||
        `Walkway to ${toNodeObj?.name || curr}`,
      pathType: prev.path?.pathType || "PEDESTRIAN",
      instruction: `Head from ${fromNodeObj?.name || prev.node} toward ${toNodeObj?.name || curr} along ${prev.path?.pathName || "path"} (${Math.round(prev.distance)}m)`,
    });
    curr = prev.node;
  }

  const startNodeObj = nodes.find((n) => n.id === startNodeId);
  const destNodeObj = nodes.find((n) => n.id === destinationNodeId);
  if (!startNodeObj || !destNodeObj) return null;

  return {
    totalDistanceMeters: Math.round(totalDistance),
    estimatedWalkMinutes: Math.max(1, Math.round(totalDistance / 75)),
    wheelchairAccessible: isWheelchair,
    startNode: {
      id: startNodeObj.id,
      nodeCode: startNodeObj.nodeCode || startNodeObj.id,
      name: startNodeObj.name || startNodeObj.id,
      latitude: Number(startNodeObj.latitude),
      longitude: Number(startNodeObj.longitude),
    },
    destinationNode: {
      id: destNodeObj.id,
      nodeCode: destNodeObj.nodeCode || destNodeObj.id,
      name: destNodeObj.name || destNodeObj.id,
      latitude: Number(destNodeObj.latitude),
      longitude: Number(destNodeObj.longitude),
    },
    steps: pathSteps.map((s, idx) => ({ stepNumber: idx + 1, ...s })),
  };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  initialTargetRoom?: string;
}

export const CampusMapModal: React.FC<Props> = ({
  visible,
  onClose,
  initialTargetRoom,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTargetRoom || "");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "academic" | "lab" | "admin" | "amenity"
  >("all");
  const [activeLocation, setActiveLocation] = useState<CampusLocation | null>(
    null,
  );
  const [startPointId, setStartPointId] = useState<string>("");
  const [startingPoints, setStartingPoints] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([]);
  const [campusNodes, setCampusNodes] = useState<any[]>([]);
  const [campusPaths, setCampusPaths] = useState<any[]>([]);
  const [mapVersion, setMapVersion] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(true);

  // Live Navigation State
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeRoute, setActiveRoute] = useState<CampusRouteResponse | null>(
    null,
  );
  const [navigatingLocation, setNavigatingLocation] =
    useState<CampusLocation | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCampusGraph() {
      setIsLoadingMap(true);
      try {
        const [topology, liveDestinations] = await Promise.all([
          getCampusTopologyApi(),
          getCampusDestinationsApi(),
        ]);

        if (topology && (topology.nodes || topology.paths)) {
          const rawNodes = topology.nodes || [];
          const rawPaths = topology.paths || [];
          const rawBuildings = topology.buildings || [];
          const meta = topology.metadata || topology.lastPublishedMeta || {};
          const currentVersion =
            meta.versionCode ||
            meta.version ||
            (meta.checksum ? "sha256-" + meta.checksum.slice(0, 8) : null);

          const mapped: CampusLocation[] = (liveDestinations || []).map(
            (d: any) => ({
              id: d.id || d.nodeId || `loc-${d.name}`,
              name: d.name || d.label || "Campus Location",
              category: (d.category?.toLowerCase() || "academic") as any,
              buildingCode: d.buildingCode || d.building || "Campus Building",
              floor: d.floor || "Ground Floor",
              hodOrIncharge: d.hodOrIncharge || "",
              phone: d.phone || "",
              description: d.description || "",
              landmark: d.landmark || "",
              rooms: Array.isArray(d.rooms) ? d.rooms : [],
              color: d.color || "#0284c7",
              bg: d.bg || "#f0f9ff",
              nodeId: d.nodeId || d.id || "",
              lat: Number(d.latitude || d.lat || 0),
              lng: Number(d.longitude || d.lng || 0),
            }),
          );

          const dynStartingPoints = rawNodes
            .filter(
              (n: any) =>
                n.nodeType === "GATE" ||
                n.nodeType === "ENTRANCE" ||
                n.nodeType === "JUNCTION",
            )
            .map((n: any) => ({
              id: n.id,
              name: `${n.nodeType === "GATE" ? "🚪" : n.nodeType === "ENTRANCE" ? "🏛️" : "⭕"} ${n.name || n.nodeCode}`,
            }));

          const effectiveStartPoints =
            dynStartingPoints.length > 0
              ? dynStartingPoints
              : rawNodes.map((n: any) => ({
                  id: n.id,
                  name: n.name || n.nodeCode,
                }));

          if (isMounted) {
            setCampusLocations(mapped);
            setCampusNodes(rawNodes);
            setCampusPaths(rawPaths);
            setStartingPoints(effectiveStartPoints);
            setMapVersion(currentVersion);
            if (effectiveStartPoints.length > 0) {
              setStartPointId(effectiveStartPoints[0].id);
            }
          }

          await AsyncStorage.setItem(
            CAMPUS_GRAPH_CACHE_KEY,
            JSON.stringify({
              version: currentVersion,
              lastSyncedAt: new Date().toISOString(),
              nodes: rawNodes,
              paths: rawPaths,
              buildings: rawBuildings,
              destinations: mapped,
            }),
          ).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn(
          "Network error loading live campus graph, falling back to cache:",
          err,
        );
      }

      // Fallback to offline cached campus map graph
      try {
        const cached = await AsyncStorage.getItem(CAMPUS_GRAPH_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.nodes && parsed?.paths) {
            const rawNodes = parsed.nodes || [];
            const dynStartingPoints = rawNodes
              .filter(
                (n: any) =>
                  n.nodeType === "GATE" ||
                  n.nodeType === "ENTRANCE" ||
                  n.nodeType === "JUNCTION",
              )
              .map((n: any) => ({
                id: n.id,
                name: `${n.nodeType === "GATE" ? "🚪" : n.nodeType === "ENTRANCE" ? "🏛️" : "⭕"} ${n.name || n.nodeCode}`,
              }));
            const effectiveStartPoints =
              dynStartingPoints.length > 0
                ? dynStartingPoints
                : rawNodes.map((n: any) => ({
                    id: n.id,
                    name: n.name || n.nodeCode,
                  }));

            if (isMounted) {
              setCampusLocations(parsed.destinations || []);
              setCampusNodes(rawNodes);
              setCampusPaths(parsed.paths || []);
              setStartingPoints(effectiveStartPoints);
              setMapVersion(parsed.version || null);
              if (effectiveStartPoints.length > 0) {
                setStartPointId(effectiveStartPoints[0].id);
              }
            }
            return;
          }
        }
      } catch {}

      if (isMounted) {
        setCampusLocations([]);
        setCampusNodes([]);
        setCampusPaths([]);
        setStartingPoints([]);
        setMapVersion(null);
        Alert.alert(
          "Map Unavailable",
          "DATA_INCOMPLETE: Campus map topology is unavailable offline. Please connect to campus network.",
        );
      }
    }

    loadCampusGraph().finally(() => {
      if (isMounted) setIsLoadingMap(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger route calculation whenever user requests navigation or changes start point
  const handleCalculateRoute = async (
    loc: CampusLocation,
    fromNodeId?: string,
  ) => {
    const origin = fromNodeId || startPointId;
    if (!origin || !loc.nodeId) {
      Alert.alert(
        "Route Unavailable",
        "Starting point or destination node not specified.",
      );
      return;
    }

    setNavigatingLocation(loc);
    setActiveLocation(loc);
    setIsCalculatingRoute(true);

    try {
      // 1. Try server calculation first
      const res = await calculateCampusRouteApi(origin, loc.nodeId);
      if (res && res.steps && res.steps.length > 0) {
        setActiveRoute(res);
        setIsCalculatingRoute(false);
        return;
      }
    } catch {
      // Offline fallback
    }

    // 2. Offline Dijkstra local graph calculation
    try {
      if (campusNodes.length > 0 && campusPaths.length > 0) {
        const offlineRoute = calculateOfflineDijkstraRoute(
          origin,
          loc.nodeId,
          campusNodes,
          campusPaths,
        );
        if (
          offlineRoute &&
          offlineRoute.steps &&
          offlineRoute.steps.length > 0
        ) {
          setActiveRoute(offlineRoute);
          setIsCalculatingRoute(false);
          return;
        }
      }
    } catch (offlineErr) {
      console.warn("Offline Dijkstra calculation error:", offlineErr);
    }

    setActiveRoute(null);
    Alert.alert(
      "Route Unavailable",
      "No route found between the selected points in the campus graph.",
    );
    setIsCalculatingRoute(false);
  };

  // Open external Google Maps / GPS Navigation app
  const handleOpenExternalMaps = async (loc: CampusLocation) => {
    const lat = loc.lat;
    const lng = loc.lng;
    const label = encodeURIComponent(
      `Govt. Holkar Science College - ${loc.name}`,
    );
    const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const gmapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    try {
      const canGeo = await Linking.canOpenURL(geoUrl);
      if (canGeo) {
        await Linking.openURL(geoUrl);
        return;
      }
    } catch {}

    try {
      await Linking.openURL(gmapsDirUrl);
    } catch {
      Linking.openURL(searchUrl).catch(() => {
        Alert.alert(
          "Location Details",
          `Target: ${loc.name}, Holkar Science College Campus, Indore.`,
        );
      });
    }
  };

  const filteredLocations = campusLocations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.buildingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.rooms.some((r) =>
        r.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesCat =
      selectedCategory === "all" || loc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <Navigation size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Campus Dept Navigator</Text>
                <Text style={styles.headerSub}>
                  Live Dijkstra Turn-by-Turn Routing & GPS
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={19} color="#1e1b24" />
            </TouchableOpacity>
          </View>

          {/* Starting Point Selector */}
          <View style={styles.startPointBox}>
            <View style={styles.startPointRow}>
              <Compass size={15} color="#5c0d38" />
              <Text style={styles.startPointLabel}>Starting From:</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.startPointsScroll}
            >
              {startingPoints.map((sp) => {
                const isSelected = startPointId === sp.id;
                return (
                  <TouchableOpacity
                    key={sp.id}
                    onPress={() => {
                      setStartPointId(sp.id);
                      if (navigatingLocation) {
                        handleCalculateRoute(navigatingLocation, sp.id);
                      }
                    }}
                    style={[
                      styles.startPill,
                      isSelected && styles.startPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.startPillText,
                        isSelected && styles.startPillTextActive,
                      ]}
                    >
                      {sp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search department, lab, room or office..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Categories */}
          <View style={styles.filterRow}>
            {[
              { label: "All", val: "all" },
              { label: "Academic", val: "academic" },
              { label: "Labs", val: "lab" },
              { label: "Admin", val: "admin" },
              { label: "Amenities", val: "amenity" },
            ].map((f) => (
              <TouchableOpacity
                key={f.val}
                onPress={() => setSelectedCategory(f.val as any)}
                style={[
                  styles.filterPill,
                  selectedCategory === f.val && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedCategory === f.val && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* LIVE ACTIVE NAVIGATION ROUTE CARD (When selected) */}
            {isCalculatingRoute && (
              <View style={styles.routeLoadingCard}>
                <ActivityIndicator size="small" color="#5c0d38" />
                <Text style={styles.routeLoadingText}>
                  Computing optimal campus walking route...
                </Text>
              </View>
            )}

            {!isCalculatingRoute && activeRoute && navigatingLocation && (
              <View style={styles.activeRouteCard}>
                <View style={styles.routeHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.liveBadgeRow}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveBadgeText}>
                        LIVE CAMPUS WALKING ROUTE
                      </Text>
                    </View>
                    <Text style={styles.routeDestTitle} numberOfLines={1}>
                      To: {navigatingLocation.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveRoute(null);
                      setNavigatingLocation(null);
                    }}
                    style={styles.clearRouteBtn}
                  >
                    <X size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Distance & Time Metrics */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Footprints size={15} color="#0284c7" />
                    <Text style={styles.metricVal}>
                      {activeRoute.totalDistanceMeters} m
                    </Text>
                    <Text style={styles.metricSub}>Distance</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Clock size={15} color="#15803d" />
                    <Text style={styles.metricVal}>
                      ~{activeRoute.estimatedWalkMinutes} mins
                    </Text>
                    <Text style={styles.metricSub}>Approx. Walk</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <CheckCircle2 size={15} color="#7c3aed" />
                    <Text style={styles.metricVal}>Paved</Text>
                    <Text style={styles.metricSub}>Accessible</Text>
                  </View>
                </View>

                {/* Turn-by-Turn Steps */}
                <View style={styles.stepsContainer}>
                  <Text style={styles.stepsHeading}>
                    Walking Steps ({activeRoute.steps.length}):
                  </Text>
                  {activeRoute.steps.map((st) => (
                    <View key={st.stepNumber} style={styles.stepItemRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                          {st.stepNumber}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepInstructionText}>
                          {st.instruction}
                        </Text>
                        <Text style={styles.stepPathText}>
                          📍 {st.pathName} • {st.distanceMeters}m
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* External GPS Open Button */}
                <TouchableOpacity
                  onPress={() => handleOpenExternalMaps(navigatingLocation)}
                  style={styles.gpsExternalBtn}
                >
                  <Navigation size={15} color="#ffffff" />
                  <Text style={styles.gpsExternalBtnText}>
                    Open Turn-by-Turn in Google Maps
                  </Text>
                  <ExternalLink size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}

            {/* 2D Building Interactive Grid */}
            <View style={styles.campusMapCard}>
              <View style={styles.mapTopBanner}>
                <Compass size={14} color="#5c0d38" />
                <Text style={styles.mapTopText}>
                  HOLKAR SCIENCE COLLEGE • CAMPUS SCHEMATIC
                </Text>
              </View>

              <View style={styles.mapGrid}>
                {campusLocations.map((loc: CampusLocation) => {
                  const isSelected = navigatingLocation?.id === loc.id;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      onPress={() => handleCalculateRoute(loc)}
                      style={[
                        styles.mapNode,
                        { borderColor: loc.color, backgroundColor: loc.bg },
                        isSelected && styles.mapNodeSelected,
                      ]}
                    >
                      <Building2 size={15} color={loc.color} />
                      <Text style={[styles.mapNodeCode, { color: loc.color }]}>
                        {loc.buildingCode}
                      </Text>
                      <Text style={styles.mapNodeName} numberOfLines={1}>
                        {loc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location Cards List */}
            <Text style={styles.sectionLabel}>
              Departments & Buildings ({filteredLocations.length}):
            </Text>
            {isLoadingMap ? (
              <View style={{ padding: 30, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#5c0d38" />
                <Text style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Loading authoritative campus graph...
                </Text>
              </View>
            ) : filteredLocations.length === 0 ? (
              <View style={{ padding: 30, alignItems: "center" }}>
                <MapPin size={32} color="#94a3b8" />
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#475569",
                    textAlign: "center",
                  }}
                >
                  No published campus destinations available.
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: "#94a3b8",
                    textAlign: "center",
                  }}
                >
                  Route unavailable offline. Download/publish campus map data
                  first.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredLocations.map((loc) => {
                  const isExpanded = activeLocation?.id === loc.id;
                  const isNavigating = navigatingLocation?.id === loc.id;

                  return (
                    <View
                      key={loc.id}
                      style={[
                        styles.card,
                        isNavigating && {
                          borderColor: "#5c0d38",
                          borderWidth: 2,
                        },
                        !isNavigating &&
                          isExpanded && {
                            borderColor: loc.color,
                            borderWidth: 1.5,
                          },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          setActiveLocation(isExpanded ? null : loc)
                        }
                        style={styles.cardTopRow}
                      >
                        <View
                          style={[
                            styles.cardIconWrap,
                            { backgroundColor: loc.bg },
                          ]}
                        >
                          <Building2 size={18} color={loc.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={[styles.cardCode, { color: loc.color }]}
                            >
                              {loc.buildingCode}
                            </Text>
                            <Text style={styles.floorText}>{loc.floor}</Text>
                          </View>
                          <Text style={styles.cardName}>{loc.name}</Text>
                          <Text style={styles.cardLandmark}>
                            📍 {loc.landmark}
                          </Text>
                        </View>
                        <ChevronRight
                          size={18}
                          color="#94a3b8"
                          style={{
                            transform: [
                              { rotate: isExpanded ? "90deg" : "0deg" },
                            ],
                          }}
                        />
                      </TouchableOpacity>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <View style={styles.expandedDetails}>
                          <View style={styles.divider} />
                          <Text style={styles.descText}>{loc.description}</Text>

                          <View style={styles.hodRow}>
                            <User size={13} color="#5c0d38" />
                            <Text style={styles.hodLabel}>
                              In-Charge / HOD:
                            </Text>
                            <Text style={styles.hodVal}>
                              {loc.hodOrIncharge}
                            </Text>
                          </View>

                          <View style={styles.roomTagRow}>
                            <Text style={styles.roomTagLabel}>
                              Rooms & Labs:
                            </Text>
                            <View style={styles.roomChips}>
                              {loc.rooms.map((r, i) => (
                                <View key={i} style={styles.rChip}>
                                  <Text style={styles.rChipText}>{r}</Text>
                                </View>
                              ))}
                            </View>
                          </View>

                          {/* Navigation Action Buttons */}
                          <View style={styles.btnRow}>
                            <TouchableOpacity
                              onPress={() => handleCalculateRoute(loc)}
                              style={[
                                styles.navBtn,
                                { backgroundColor: "#5c0d38" },
                              ]}
                            >
                              <Footprints size={14} color="#ffffff" />
                              <Text style={styles.navBtnText}>
                                Get Walking Route 🚶
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleOpenExternalMaps(loc)}
                              style={[
                                styles.navBtn,
                                { backgroundColor: loc.color },
                              ]}
                            >
                              <Navigation size={14} color="#ffffff" />
                              <Text style={styles.navBtnText}>
                                Google Maps 🗺️
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "85%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5c0d38",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1b24",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  startPointBox: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#fdf2f7",
    borderBottomWidth: 1,
    borderBottomColor: "#fce7f3",
  },
  startPointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  startPointLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5c0d38",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  startPointsScroll: {
    flexDirection: "row",
  },
  startPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
    marginBottom: 4,
  },
  startPillActive: {
    backgroundColor: "#5c0d38",
    borderColor: "#5c0d38",
  },
  startPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  startPillTextActive: {
    color: "#ffffff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  filterPillActive: {
    backgroundColor: "#1e1b24",
  },
  filterText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  routeLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#fdf2f7",
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fce7f3",
  },
  routeLoadingText: {
    fontSize: 12,
    color: "#5c0d38",
    fontWeight: "600",
  },
  activeRouteCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#5c0d38",
    shadowColor: "#5c0d38",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  routeDestTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e1b24",
  },
  clearRouteBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  metricsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricItem: {
    alignItems: "center",
  },
  metricVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: "#64748b",
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#cbd5e1",
  },
  stepsContainer: {
    marginBottom: 12,
  },
  stepsHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  stepItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#5c0d38",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  stepInstructionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 17,
  },
  stepPathText: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  gpsExternalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#15803d",
    paddingVertical: 11,
    borderRadius: 10,
  },
  gpsExternalBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  campusMapCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mapTopBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  mapTopText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5c0d38",
    letterSpacing: 0.5,
  },
  mapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mapNode: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  mapNodeSelected: {
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  mapNodeCode: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  mapNodeName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1e1b24",
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCode: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  floorText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  cardName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 1,
  },
  cardLandmark: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  expandedDetails: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 10,
  },
  descText: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 8,
  },
  hodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  hodLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  hodVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e1b24",
  },
  roomTagRow: {
    marginBottom: 12,
  },
  roomTagLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  roomChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  rChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rChipText: {
    fontSize: 10,
    color: "#334155",
    fontWeight: "500",
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
});
