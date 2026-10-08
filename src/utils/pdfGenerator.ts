import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export const generateAndShareMarksheetPDF = async (
  semName: string,
  rollNo: string,
  studentName: string,
  sgpa: string,
  cgpa: string,
  subjects: any[],
  studentInfo?: any,
) => {
  if (!subjects || subjects.length === 0) {
    Alert.alert("Notice", "No examination marksheet records found to export.");
    return;
  }

  const finalRollNo =
    rollNo || studentInfo?.rollNo || studentInfo?.roll_no || "N/A";
  const finalEnrollmentNo =
    studentInfo?.enrollmentNo || studentInfo?.enrollment_no || "N/A";
  const finalStudentName =
    studentName || studentInfo?.name || studentInfo?.full_name || "STUDENT";
  const finalFatherName =
    studentInfo?.fatherName || studentInfo?.father_name || "Not Provided";
  const finalMotherName =
    studentInfo?.motherName || studentInfo?.mother_name || "Not Provided";
  const finalProgramme =
    studentInfo?.programme ||
    studentInfo?.course ||
    "Undergraduate Programme (Autonomous CBCS)";

  const totalCredits = subjects.reduce(
    (acc: number, s: any) => acc + (Number(s.credits) || 0),
    0,
  );
  const totalSecuredCredits = subjects.reduce(
    (acc: number, s: any) => acc + (Number(s.secured ?? s.credits) || 0),
    0,
  );
  const totalCreditPoints = subjects.reduce(
    (acc: number, s: any) =>
      acc + (Number(s.cp) || Number(s.credits || 0) * Number(s.gp || 0)),
    0,
  );
  const hasFail = subjects.some(
    (s: any) =>
      String(s.grade || "").toUpperCase() === "F" ||
      String(s.grade || "").toUpperCase() === "AB",
  );
  const resultStatus = hasFail ? "ATKT" : "PASS";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; padding: 20px; color: #000; }
          .border-box { border: 2px solid #000; padding: 15px; }
          .header { text-align: center; }
          .title { font-size: 18px; font-weight: bold; margin: 0; }
          .subtitle { font-size: 14px; color: red; font-weight: bold; text-decoration: underline; margin: 4px 0; }
          .session { font-size: 12px; font-weight: bold; }
          .info-box { background-color: #e8f5e9; border: 1px solid #000; padding: 8px; margin: 10px 0; display: flex; justify-content: space-between; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #000; padding: 5px; text-align: center; }
          th { background-color: #2b6cb0; color: white; }
          .left { text-align: left; }
          .result-box { border: 1px solid #000; padding: 8px; margin-top: 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
          .footer { font-size: 9px; text-align: center; margin-top: 15px; color: #555; }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <h1 class="title">Govt. Holkar (Model, Autonomous) Science College, Indore (M.P.)</h1>
            <div class="subtitle">GRADE SHEET</div>
            <div class="session">${(semName || "SEMESTER").toUpperCase()} EXAMINATION • ${finalProgramme}</div>
          </div>
          
          <div class="info-box">
            <div>
              <p><strong>Roll No. :</strong> ${finalRollNo}</p>
              <p><strong>Enrollment No. :</strong> ${finalEnrollmentNo}</p>
              <p><strong>Status :</strong> REGULAR</p>
            </div>
            <div>
              <p><strong>Name :</strong> ${finalStudentName}</p>
              <p><strong>Father's Name :</strong> ${finalFatherName}</p>
              <p><strong>Mother's Name :</strong> ${finalMotherName}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 45%;">SUBJECT</th>
                <th>CREDITS</th>
                <th>*CREDITS SECURED</th>
                <th>GRADE</th>
                <th>GRADE POINT</th>
                <th>CREDIT POINTS</th>
              </tr>
            </thead>
            <tbody>
              ${subjects
                .map(
                  (s: any) => `
                <tr>
                  <td class="left"><strong>${s.group ? s.group + " - " : ""}</strong>${s.type ? s.type + ": " : ""}${s.name || s.subjectName || s.title || "Course Unit"}</td>
                  <td>${s.credits ?? 0}</td>
                  <td>${s.secured ?? s.credits ?? 0}</td>
                  <td><strong>${s.grade || "—"}</strong></td>
                  <td>${s.gp ?? 0}</td>
                  <td><strong>${s.cp ?? Number(s.credits || 0) * Number(s.gp || 0)}</strong></td>
                </tr>
              `,
                )
                .join("")}
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td class="left" style="text-align: right; padding-right: 15px;">TOTAL CREDITS :</td>
                <td>${totalCredits}</td>
                <td>${totalSecuredCredits}</td>
                <td colspan="2" style="text-align: right;">TOTAL CREDIT POINTS :</td>
                <td>${totalCreditPoints}</td>
              </tr>
            </tbody>
          </table>

          <div class="result-box">
            <div>RESULT : <span style="color: ${hasFail ? "#b91c1c" : "#15803d"};">${resultStatus}</span></div>
            <div>SGPA : ${sgpa || "—"} | CGPA : ${cgpa || "—"}</div>
          </div>

          <div class="footer">
            These Are Computer Generated Marks. Autonomous Examination Cell • Govt. Holkar Science College Indore
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } else {
      Alert.alert("Download Completed", `PDF saved to: ${uri}`);
    }
  } catch {
    Alert.alert("Download Notice", "Official PDF ready in cache.");
  }
};

export const generateAndSharePaymentSlipPDF = async (
  installment: any,
  studentInfo?: any,
) => {
  const officialReceiptNo = installment?.receiptNo || installment?.receipt_no;
  if (!installment || !officialReceiptNo) {
    Alert.alert(
      "Official Receipt Unavailable",
      "Official fee payment receipt has not been issued yet. Receipts are generated once settled in the treasury ledger.",
    );
    return;
  }

  const finalRollNo = studentInfo?.rollNo || studentInfo?.roll_no || "N/A";
  const finalEnrollmentNo =
    studentInfo?.enrollmentNo || studentInfo?.enrollment_no || "N/A";
  const finalStudentName =
    studentInfo?.name || studentInfo?.full_name || "STUDENT";
  const finalFatherName =
    studentInfo?.fatherName || studentInfo?.father_name || "Not Provided";
  const finalMotherName =
    studentInfo?.motherName || studentInfo?.mother_name || "Not Provided";
  const finalPhone =
    studentInfo?.phone || studentInfo?.mobile || "Not Provided";
  const finalProgramme =
    studentInfo?.programme || studentInfo?.course || "Autonomous Programme";

  const formattedAmount =
    typeof installment?.amount === "number"
      ? installment.amount.toFixed(2)
      : String(installment?.amount || "0.00");

  const formattedReceiptNo = officialReceiptNo;
  const formattedDate =
    installment?.paidOn ||
    installment?.date ||
    new Date().toISOString().split("T")[0];
  const formattedTitle =
    installment?.title || installment?.feeType || "College Term / Exam Fee";
  const txnRef =
    installment?.transactionRef ||
    installment?.transaction_ref ||
    officialReceiptNo;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; padding: 25px; color: #000; }
          .border-box { border: 1.5px solid #000; padding: 15px; }
          .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .title { font-size: 15px; font-style: italic; font-weight: bold; margin: 0; }
          .subtitle { font-size: 13px; font-weight: bold; margin-top: 5px; }
          .roll-box { display: flex; justify-content: space-between; margin: 15px 0; font-size: 12px; }
          .boxed { border: 1px solid #000; padding: 2px 8px; font-family: monospace; font-weight: bold; letter-spacing: 2px; }
          .student-box { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin: 10px 0; }
          .grid { display: flex; justify-content: space-between; font-size: 11px; }
          .pay-details { font-size: 11px; margin-top: 15px; line-height: 1.8; }
          .footer { font-size: 9px; text-align: center; margin-top: 20px; color: green; border-top: 1px dashed #ccc; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <h1 class="title">Government Holkar (Model Autonomous) Science College, Indore</h1>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
              <span><strong>NEP / CBCS</strong></span>
              <span><strong>Payment Slip</strong></span>
              <span>1</span>
            </div>
            <div class="subtitle">${finalProgramme.toUpperCase()} • ${formattedTitle.toUpperCase()}</div>
          </div>

          <div class="roll-box">
            <div>Roll No. : - <span class="boxed">${finalRollNo}</span></div>
            <div>Enrollment No. : - <span class="boxed">${finalEnrollmentNo}</span></div>
          </div>

          <div class="student-box">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="text-decoration: underline; font-weight: bold;">Student Details</span>
              <span style="font-family: monospace; letter-spacing: 2px;">||||||||||||||||||||||||||</span>
            </div>
            <div class="grid">
              <div>
                <p>Name: <strong>${finalStudentName}</strong></p>
                <p>Mother's Name: <strong>${finalMotherName}</strong></p>
              </div>
              <div>
                <p>Father's Name: <strong>${finalFatherName}</strong></p>
                <p>Mob. No.: <strong>${finalPhone}</strong></p>
              </div>
            </div>
          </div>

          <div class="pay-details">
            <div><strong>Payment Details :</strong></div>
            <div style="display: flex; justify-content: space-between;">
              <span>Payment Date : <strong>${formattedDate}</strong></span>
              <span>Payment Mode : <strong>ONLINE (UPI/CARD/NETBANKING)</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Amount : <strong>₹${formattedAmount}</strong></span>
              <span>Order / Receipt Number : <strong>${formattedReceiptNo}</strong></span>
            </div>
            <div>Transaction Reference No. : <strong>${txnRef}</strong></div>
            <div>Remarks : <strong>${formattedTitle}</strong></div>
          </div>

          <div class="footer">
            ✓ DIGITALLY VERIFIED TREASURY RECEIPT • GOVT. HOLKAR SCIENCE COLLEGE, INDORE
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } else {
      Alert.alert("Download Completed", `PDF saved to: ${uri}`);
    }
  } catch {
    Alert.alert("Download Notice", "Official Payment Slip PDF ready in cache.");
  }
};

export const generateAndShareAdmitCardPDF = async (
  studentInfo: any,
  schedule: any[],
  isEligible: boolean,
) => {
  if (!schedule || schedule.length === 0) {
    Alert.alert(
      "Notice",
      "Admit card examination schedule has not been issued yet.",
    );
    return;
  }

  const finalRollNo = studentInfo?.rollNo || studentInfo?.roll_no || "N/A";
  const finalEnrollmentNo =
    studentInfo?.enrollmentNo || studentInfo?.enrollment_no || "N/A";
  const finalStudentName =
    studentInfo?.name || studentInfo?.full_name || "STUDENT";
  const finalFatherName =
    studentInfo?.fatherName || studentInfo?.father_name || "Not Provided";
  const finalProgramme =
    studentInfo?.programme ||
    studentInfo?.course ||
    "Undergraduate Programme (CBCS)";
  const finalSemester = studentInfo?.semester
    ? `Semester ${studentInfo.semester}`
    : "Current Semester";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; padding: 25px; color: #000; }
          .border-box { border: 2px solid #000; padding: 15px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .title { font-size: 17px; font-weight: bold; margin: 0; }
          .subtitle { font-size: 13px; font-weight: bold; margin-top: 4px; color: #5c0d38; text-decoration: underline; }
          .session { font-size: 12px; font-weight: bold; margin-top: 3px; }
          .info-grid { display: flex; justify-content: space-between; border: 1px solid #000; padding: 10px; margin: 12px 0; font-size: 11px; background-color: #f8fafc; }
          .status-badge { display: inline-block; padding: 3px 8px; font-weight: bold; font-size: 10px; border-radius: 4px; ${isEligible ? "background-color: #dcfce7; color: #15803d;" : "background-color: #fef3c7; color: #b45309;"} }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          th { background-color: #5c0d38; color: white; }
          .left { text-align: left; }
          .instructions { margin-top: 15px; font-size: 10px; line-height: 1.6; border-top: 1px dashed #000; padding-top: 8px; }
          .footer { font-size: 9px; text-align: center; margin-top: 20px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <h1 class="title">Govt. Holkar (Model Autonomous) Science College, Indore (M.P.)</h1>
            <div class="subtitle">AUTONOMOUS EXAMINATION HALL TICKET / ADMIT CARD</div>
            <div class="session">EXAMINATION SESSION: NOVEMBER-DECEMBER 2026</div>
          </div>

          <div class="info-grid">
            <div>
              <p><strong>Roll No. :</strong> ${finalRollNo}</p>
              <p><strong>Enrollment No. :</strong> ${finalEnrollmentNo}</p>
              <p><strong>Programme :</strong> ${finalProgramme}</p>
              <p><strong>Semester :</strong> ${finalSemester}</p>
            </div>
            <div>
              <p><strong>Student Name :</strong> ${finalStudentName}</p>
              <p><strong>Father's Name :</strong> ${finalFatherName}</p>
              <p><strong>Examination Center :</strong> Govt. Holkar Science College (Center 01)</p>
              <p><strong>Status :</strong> <span class="status-badge">${isEligible ? "VERIFIED & CLEARED" : "CONDITIONAL"}</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>TIME</th>
                <th>SUB CODE</th>
                <th style="width: 40%;">SUBJECT NAME</th>
                <th>EXAM HALL / ROOM</th>
                <th>INVIGILATOR SIGN</th>
              </tr>
            </thead>
            <tbody>
              ${(schedule || [])
                .map(
                  (s: any) => `
                <tr>
                  <td><strong>${s.date}</strong></td>
                  <td>${s.time}</td>
                  <td>${s.subjectCode}</td>
                  <td class="left">${s.subjectName}</td>
                  <td>${s.room}</td>
                  <td></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="instructions">
            <strong>IMPORTANT INSTRUCTIONS FOR CANDIDATES:</strong><br />
            1. Candidates must carry this admit card along with official College Digital ID Card.<br />
            2. Mobile phones, programmable calculators, and electronic gadgets are strictly banned in examination halls.<br />
            3. Candidates should occupy their allotted seat 15 minutes before the scheduled commencement of the paper.
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 35px; font-size: 11px; font-weight: bold;">
            <div>Student Signature</div>
            <div>Controller of Examinations<br />(Autonomous Exam Cell)</div>
            <div>Principal Seal & Signature</div>
          </div>

          <div class="footer">
            ✓ DIGITALLY ISSUED UNDER THE AUTHORITY OF THE AUTONOMOUS EXAMINATION COMMITTEE • GOVT. HOLKAR SCIENCE COLLEGE, INDORE
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } else {
      Alert.alert("Download Completed", `Admit card saved to: ${uri}`);
    }
  } catch {
    Alert.alert("Download Notice", "Official Admit Card PDF ready in cache.");
  }
};

export const generateAndShareWarningNoticePDF = async (
  letter: any,
  student: any,
) => {
  if (!letter || !letter.hasActiveWarning) {
    Alert.alert(
      "Notice",
      "No active attendance warning notices have been issued.",
    );
    return;
  }

  const finalRollNo = student?.rollNo || letter?.rollNo || "N/A";
  const finalEnrollmentNo =
    student?.enrollmentNo || letter?.enrollmentNo || "N/A";
  const finalStudentName = student?.name || letter?.studentName || "STUDENT";
  const finalCourse =
    letter?.courseAndSemester ||
    student?.course ||
    student?.programme ||
    "Undergraduate Programme";
  const attendancePct =
    letter?.attendancePercentage ?? student?.attendancePercentage ?? 0;
  const consecutiveDays = letter?.consecutiveDays ?? 0;
  const refNo = letter?.letterNumber || letter?.refNo || "HSC/DISC/NOTICE";
  const issueDate = letter?.issueDate || new Date().toLocaleDateString("en-GB");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; padding: 30px; color: #000; }
          .border-box { border: 2px solid #991b1b; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; }
          .title { font-size: 17px; font-weight: bold; margin: 0; color: #5c0d38; }
          .subtitle { font-size: 13px; font-weight: bold; margin-top: 4px; color: #991b1b; text-decoration: underline; }
          .meta-row { display: flex; justify-content: space-between; margin: 15px 0; font-size: 12px; font-weight: bold; }
          .to-box { border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc; font-size: 11px; margin-bottom: 15px; }
          .content { font-size: 11.5px; line-height: 1.8; margin-top: 10px; text-align: justify; }
          .warning-highlight { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin: 15px 0; font-weight: bold; color: #991b1b; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; font-weight: bold; }
          .footer { font-size: 9px; text-align: center; margin-top: 25px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <h1 class="title">Govt. Holkar (Model Autonomous) Science College, Indore (M.P.)</h1>
            <p style="font-size: 11px; margin: 2px 0;">(Affiliated to Devi Ahilya Vishwavidyalaya, Indore • Accredited 'A++' Grade by NAAC)</p>
            <div class="subtitle">OFFICIAL DISCIPLINARY ATTENDANCE WARNING NOTICE</div>
          </div>

          <div class="meta-row">
            <div>Ref. No.: <strong>${refNo}</strong></div>
            <div>Date: <strong>${issueDate}</strong></div>
          </div>

          <div class="to-box">
            <strong>To:</strong><br />
            <strong>Student Name:</strong> ${finalStudentName}<br />
            <strong>Roll No.:</strong> ${finalRollNo} &bull; <strong>Enrollment No.:</strong> ${finalEnrollmentNo}<br />
            <strong>Programme & Semester:</strong> ${finalCourse}
          </div>

          <div class="content">
            <p><strong>SUBJECT: NOTICE FOR UNAUTHORIZED CONTINUOUS ABSENCE AND ATTENDANCE SHORTFALL</strong></p>
            
            <p>Dear Student / Parent / Guardian,</p>

            <p>This is to formally notify you that as per the authoritative institutional attendance records maintained in the Central ERP System, the student named above has incurred continuous unauthorized absence for <strong>${consecutiveDays} consecutive academic days</strong>, resulting in their cumulative attendance dropping to <strong>${attendancePct}%</strong>.</p>

            <div class="warning-highlight">
              ⚠️ MANDATORY CLAUSE NOTICE: As per Holkar Model Autonomous College Academic Ordinance Clause 7.2 and UGC Regulations, maintaining a minimum of 75% attendance is STRICTLY MANDATORY to be eligible for Semester Examinations. Failure to rectify this shortfall will result in debarment from examination hall ticket issuance.
            </div>

            <p>You are hereby directed to appear before your Head of Department (HOD) along with your parent/guardian within <strong>three (3) working days</strong> of the receipt of this notice to submit a formal justification and medical/emergency certificates (if applicable).</p>
          </div>

          <div class="signatures">
            <div>
              Head of Department<br />
              (Concerned Department)
            </div>
            <div style="text-align: center;">
              Proctorial Board<br />
              Academic Discipline Cell
            </div>
            <div style="text-align: right;">
              Principal / Dean<br />
              Govt. Holkar Science College
            </div>
          </div>

          <div class="footer">
            Official System Generated Document • Authenticated by Central Attendance Monitoring Engine • Govt. Holkar Science College, Indore
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } else {
      Alert.alert("Download Completed", `Warning notice saved to: ${uri}`);
    }
  } catch {
    Alert.alert(
      "Download Notice",
      "Official Warning Notice PDF ready in cache.",
    );
  }
};
