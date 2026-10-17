// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function uid(prefix = "ID"): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

// ============================================================
// CONVERT DATA TO CSV
// ============================================================

export function csv(rows: any[]): string {
  if (!rows || rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const headerRow = headers.map(escapeCSV).join(",");

  const dataRows = rows.map((row) =>
    headers
      .map((header) => escapeCSV(row[header]))
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

// ============================================================
// DOWNLOAD FILE
// ============================================================

export function download(
  filename: string,
  content: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ============================================================
// DEMO DATABASE
// ============================================================

export function seed() {
  // ==========================================================
  // IMPORTANT
  // ==========================================================
  // S1 belongs to Dareddy.Nagashree.
  //
  // Parent Dareddy.Roja is connected to S1.
  //
  // Parent:
  //   Dareddy.Roja
  //   roja123@campusflow.edu
  //
  // Student:
  //   Dareddy.Nagashree
  //   S1
  //   nagashree@campusflow.edu
  // ==========================================================

  const studentId = "S1";

  return {
    // ========================================================
    // STUDENTS
    // ========================================================

    students: (() => {
      // ─── helpers ───────────────────────────────────────────
      const DEPTS = [
        { short: "CS",  full: "Computer Science(CS)",  code: "CS" },
        { short: "EC",  full: "Electronics(ECE)",       code: "EC" },
        { short: "ME",  full: "Mechanical(ME)",         code: "ME" },
        { short: "CE",  full: "Civil(CE)",              code: "CE" },
      ];
      const YEARS  = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
      const SECS   = ["A", "B", "C", "D", "E"];

      // Admission year per academic year
      const admYear: Record<string, string> = {
        "1st Year": "2026", "2nd Year": "2025",
        "3rd Year": "2024", "4th Year": "2023",
      };

      const FIRST_M = ["Arjun","Rahul","Kiran","Suresh","Vikram","Ankit","Ravi","Manoj","Sai","Rajesh","Pradeep","Anil","Ganesh","Harish","Naveen","Deepak","Lokesh","Charan","Rohit","Satish"];
      const FIRST_F = ["Priya","Ananya","Sneha","Divya","Kavya","Pooja","Lavanya","Swathi","Meghana","Sravani","Mounika","Harshitha","Bhavana","Keerthi","Sowmya","Nandini","Revathi","Tejaswi","Padmaja","Umamaheswari"];
      const LAST    = ["Kumar","Sharma","Reddy","Rao","Singh","Patel","Naidu","Nair","Verma","Gupta","Iyer","Rajan","Pillai","Choudhury","Joshi","Tiwari","Mehta","Agarwal","Das","Menon"];

      const used = new Set<string>();
      let counter = 4; // S1-S3 already used above

      const rows: any[] = [
        // ── keep the 3 original students ──────────────────────
        {
          id: "S1",
          full_name: "Dareddy.Nagashree",
          email: "nagashree@campusflow.edu",
          phone: "9052732998",
          gender: "Female",
          department: "Computer Science(CS)",
          course: "B.Tech",
          year: "3rd Year",
          section: "A",
          roll_number: "CS24471A4611",
          address: "Hyderabad",
          dob: "2007-09-02",
          admission_date: "2024-08-01",
          status: "Active",
        },
        {
          id: "S2",
          full_name: "Ananya Sharma",
          email: "ananya.sharma@campusflow.edu",
          phone: "9876543211",
          gender: "Female",
          department: "Electronics(ECE)",
          course: "B.Tech",
          year: "3rd Year",
          section: "A",
          roll_number: "EC24A002",
          address: "Hyderabad",
          dob: "2004-07-20",
          admission_date: "2024-08-01",
          status: "Active",
        },
        {
          id: "S3",
          full_name: "Rahul Kumar",
          email: "rahul.kumar@campusflow.edu",
          phone: "9876543212",
          gender: "Male",
          department: "Mechanical(ME)",
          course: "B.Tech",
          year: "3rd Year",
          section: "B",
          roll_number: "ME24B003",
          address: "Hyderabad",
          dob: "2004-03-10",
          admission_date: "2024-08-01",
          status: "Active",
        },
      ];

      // ── generate bulk students ─────────────────────────────
      // 4 depts × 4 years × 5 sections × 5 students = 400 additional
      DEPTS.forEach((dept) => {
        YEARS.forEach((yr) => {
          SECS.forEach((sec) => {
            const ay = admYear[yr];
            // Track per-section roll index
            let rollIdx = 1;
            for (let i = 0; i < 5; i++) {
              const isFemale = i % 2 === 0;
              const fNames   = isFemale ? FIRST_F : FIRST_M;
              const firstName = fNames[(counter + i * 3) % fNames.length];
              const lastName  = LAST[(counter + i * 7) % LAST.length];
              const name      = `${firstName} ${lastName}`;

              // unique email
              let emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}`;
              while (used.has(emailBase)) emailBase += "x";
              used.add(emailBase);

              const rollNo = `${dept.code}${ay}${sec}${String(rollIdx).padStart(3, "0")}`;
              rollIdx++;

              const phone = `90${String(5000000000 + counter * 7).slice(0, 8)}`;
              const status = counter % 17 === 0 ? "Inactive" : "Active";

              rows.push({
                id: `S${counter}`,
                full_name: name,
                email: `${emailBase}@campusflow.edu`,
                phone,
                gender: isFemale ? "Female" : "Male",
                department: dept.full,
                course: "B.Tech",
                year: yr,
                section: sec,
                roll_number: rollNo,
                address: ["Hyderabad","Chennai","Bangalore","Vijayawada","Warangal"][counter % 5],
                dob: `${2000 + (counter % 6)}-${String((counter % 12) + 1).padStart(2,"0")}-${String((counter % 28) + 1).padStart(2,"0")}`,
                admission_date: `${ay}-08-01`,
                status,
              });
              counter++;
            }
          });
        });
      });

      return rows;
    })(),

    // ========================================================
    // PARENTS
    // ========================================================

    parents: [
      {
        id: "P1",

        // Parent
        full_name: "Dareddy.Roja",

        // Parent login email
        email: "roja123@campusflow.edu",

        // ====================================================
        // CHILD LINK
        // ====================================================
        // S1 = Dareddy.Nagashree
        // ====================================================
        student_id: "S1",

        phone: "9052732998",
        relationship: "Mother",
      },
    ],

    // ========================================================
    // TEACHERS
    // ========================================================

    teachers: (() => {
      const DEPTS = [
        { name: "Computer Science",  subjects: ["Data Structures","DBMS","Operating Systems","Computer Networks","Software Engineering"] },
        { name: "Electronics",        subjects: ["Circuit Theory","Digital Electronics","Microprocessors","VLSI Design","Signals & Systems"] },
        { name: "Mechanical",         subjects: ["Thermodynamics","Fluid Mechanics","Machine Design","Manufacturing Processes","Strength of Materials"] },
        { name: "Civil",              subjects: ["Structural Analysis","Concrete Technology","Geotechnical Engineering","Hydraulics","Transportation Engg"] },
      ];
      const TITLES   = ["Dr.","Prof.","Mr.","Ms.","Mrs."];
      const FIRST_M  = ["Rajesh","Anil","Suresh","Vikram","Kiran","Ganesh","Harish","Naveen","Deepak","Satish"];
      const FIRST_F  = ["Priya","Ananya","Sneha","Divya","Kavya","Pooja","Lavanya","Swathi","Meghana","Sravani"];
      const LAST     = ["Rao","Kumar","Sharma","Reddy","Naidu","Iyer","Nair","Pillai","Joshi","Verma"];
      const QUALS    = ["Ph.D (CS)","M.Tech","Ph.D (ECE)","M.E","Ph.D (ME)","M.Tech (Structures)","Ph.D (Civil)","M.Sc","MBA+BE","M.Phil"];
      const rows: any[] = [
        { id:"T1", full_name:"Dr. Priya Rao",   email:"priya.rao@campusflow.edu",  phone:"9876500010", department:"Computer Science", subject:"Data Structures",          qualification:"Ph.D (CS)", experience:"8 years", joining_date:"2018-07-01", status:"Active" },
        { id:"T2", full_name:"Prof. Raj Kumar",  email:"raj.kumar@campusflow.edu",  phone:"9876500011", department:"Computer Science", subject:"Database Management Systems",qualification:"M.Tech",   experience:"6 years", joining_date:"2020-07-01", status:"Active" },
      ];
      let counter = 3;
      DEPTS.forEach((dept) => {
        dept.subjects.forEach((subj, si) => {
          if (dept.name === "Computer Science" && si < 2) return; // already added T1, T2
          const isFemale = counter % 2 === 0;
          const fn = isFemale ? FIRST_F[counter % FIRST_F.length] : FIRST_M[counter % FIRST_M.length];
          const ln = LAST[counter % LAST.length];
          const title = TITLES[counter % TITLES.length];
          rows.push({
            id: `T${counter}`,
            full_name: `${title} ${fn} ${ln}`,
            email: `${fn.toLowerCase()}.${ln.toLowerCase()}${counter}@campusflow.edu`,
            phone: `987650${String(counter).padStart(4,"0")}`,
            department: dept.name,
            subject: subj,
            qualification: QUALS[counter % QUALS.length],
            experience: `${(counter % 10) + 1} years`,
            joining_date: `${2015 + (counter % 8)}-07-01`,
            status: counter % 11 === 0 ? "On Leave" : "Active",
          });
          counter++;
        });
      });
      return rows;
    })(),

    // ========================================================
    // CLASSES
    // ========================================================

    classes: [
      {
        id: "C1",
        name: "B.Tech CS - 3rd Year A",
        department: "Computer Science",
        year: "3rd Year",
        section: "A",
        teacher_id: "T1",
      },
    ],

    // ========================================================
    // SUBJECTS
    // ========================================================

    subjects: [
      {
        id: "SUB1",
        name: "Data Structures",
        code: "CS301",
        department: "Computer Science",
      },

      {
        id: "SUB2",
        name: "Database Management Systems",
        code: "CS302",
        department: "Computer Science",
      },

      {
        id: "SUB3",
        name: "Operating Systems",
        code: "CS303",
        department: "Computer Science",
      },

      {
        id: "SUB4",
        name: "Computer Networks",
        code: "CS304",
        department: "Computer Science",
      },
    ],

    // ========================================================
    // ATTENDANCE
    // ========================================================

    attendance: [
      {
        id: "ATT1",
        student_id: studentId,
        date: "2026-09-01",
        status: "Present",
      },

      {
        id: "ATT2",
        student_id: studentId,
        date: "2026-09-02",
        status: "Present",
      },

      {
        id: "ATT3",
        student_id: studentId,
        date: "2026-09-03",
        status: "Present",
      },

      {
        id: "ATT4",
        student_id: studentId,
        date: "2026-09-04",
        status: "Absent",
      },

      {
        id: "ATT5",
        student_id: studentId,
        date: "2026-09-05",
        status: "Present",
      },

      {
        id: "ATT6",
        student_id: studentId,
        date: "2026-09-08",
        status: "Present",
      },

      {
        id: "ATT7",
        student_id: studentId,
        date: "2026-09-09",
        status: "Present",
      },

      {
        id: "ATT8",
        student_id: studentId,
        date: "2026-09-10",
        status: "Present",
      },

      {
        id: "ATT9",
        student_id: studentId,
        date: "2026-09-11",
        status: "Present",
      },

      {
        id: "ATT10",
        student_id: studentId,
        date: "2026-09-12",
        status: "Absent",
      },

      {
        id: "ATT11",
        student_id: studentId,
        date: "2026-09-15",
        status: "Present",
      },

      {
        id: "ATT12",
        student_id: studentId,
        date: "2026-09-16",
        status: "Present",
      },

      {
        id: "ATT13",
        student_id: studentId,
        date: "2026-09-17",
        status: "Present",
      },

      {
        id: "ATT14",
        student_id: studentId,
        date: "2026-09-18",
        status: "Present",
      },

      {
        id: "ATT15",
        student_id: studentId,
        date: "2026-09-19",
        status: "Present",
      },
    ],

    // ========================================================
    // MARKS
    // ========================================================

    marks: [
      // ── Mid Semester ────────────────────────────────────────
      {
        id: "M1",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Data Structures",
        exam: "Mid Semester",
        internal: 18,
        external: 70,
        total: 88,
        grade: "A",
        status: "Pass",
        teacher_remark: "Excellent performance. Keep it up!",
      },
      {
        id: "M2",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Database Management Systems",
        exam: "Mid Semester",
        internal: 17,
        external: 68,
        total: 85,
        grade: "A",
        status: "Pass",
        teacher_remark: "Good understanding of concepts.",
      },
      {
        id: "M3",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Operating Systems",
        exam: "Mid Semester",
        internal: 10,
        external: 28,
        total: 38,
        grade: "F",
        status: "Fail",
        teacher_remark: "The student needs to focus more on important topics and practice previous year question papers. Regular revision and additional practice are recommended.",
        failure_reasons: [
          "External examination marks (28/80) are below the passing requirement (minimum 32).",
          "Total marks (38/100) are below the passing marks (minimum 40).",
          "The student needs improvement in external exam preparation.",
        ],
      },
      {
        id: "M4",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Computer Networks",
        exam: "Mid Semester",
        internal: 12,
        external: 25,
        total: 37,
        grade: "F",
        status: "Fail",
        teacher_remark: "The student has not performed well in both internal and external assessments. More practical problem solving and regular study is required.",
        failure_reasons: [
          "Both internal (12/20) and external (25/80) marks are below the required minimum.",
          "Total marks (37/100) are below the passing marks (minimum 40).",
          "The student needs improvement in overall performance.",
        ],
      },
      // ── Unit Tests ──────────────────────────────────────────
      {
        id: "M5",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Data Structures",
        exam: "Unit Test",
        internal: 19,
        external: 72,
        total: 91,
        grade: "A+",
        status: "Pass",
        teacher_remark: "Outstanding! One of the top performers in the class.",
      },
      {
        id: "M6",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Database Management Systems",
        exam: "Unit Test",
        internal: 18,
        external: 70,
        total: 88,
        grade: "A",
        status: "Pass",
        teacher_remark: "Very good. Continue the same effort.",
      },
      {
        id: "M7",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        class_id: "C1",
        subject: "Software Engineering",
        exam: "Mid Semester",
        internal: 15,
        external: 55,
        total: 70,
        grade: "B+",
        status: "Pass",
        teacher_remark: "Good effort. Focus on design patterns more.",
      },
    ],

    // ========================================================
    // EXAMINATIONS
    // ========================================================

    exams: [
      {
        id: "EX1",
        name: "Mid Semester Examination",
        title: "Mid Semester Examination",
        exam_name: "Mid Semester Examination",
        subject: "Data Structures",
        date: "2026-10-05",
        exam_date: "2026-10-05",
        start_time: "10:00 AM",
        end_time: "12:00 PM",
        room: "Block A - Room 101",
        venue: "Block A - Room 101",
        status: "Scheduled",
      },

      {
        id: "EX2",
        name: "Mid Semester Examination",
        title: "Mid Semester Examination",
        exam_name: "Mid Semester Examination",
        subject: "Database Management Systems",
        date: "2026-10-07",
        exam_date: "2026-10-07",
        start_time: "10:00 AM",
        end_time: "12:00 PM",
        room: "Block A - Room 102",
        venue: "Block A - Room 102",
        status: "Scheduled",
      },

      {
        id: "EX3",
        name: "Mid Semester Examination",
        title: "Mid Semester Examination",
        exam_name: "Mid Semester Examination",
        subject: "Operating Systems",
        date: "2026-10-09",
        exam_date: "2026-10-09",
        start_time: "10:00 AM",
        end_time: "12:00 PM",
        room: "Block B - Room 201",
        venue: "Block B - Room 201",
        status: "Scheduled",
      },

      {
        id: "EX4",
        name: "Mid Semester Examination",
        title: "Mid Semester Examination",
        exam_name: "Mid Semester Examination",
        subject: "Computer Networks",
        date: "2026-10-12",
        exam_date: "2026-10-12",
        start_time: "10:00 AM",
        end_time: "12:00 PM",
        room: "Block B - Room 202",
        venue: "Block B - Room 202",
        status: "Scheduled",
      },
    ],

    // ========================================================
    // ASSIGNMENTS
    // ========================================================

    assignments: [
      {
        id: "AS1",
        title: "Data Structures Assignment",
        subject: "Data Structures",
        due_date: "2026-09-30",
        status: "Pending",
      },
    ],

    // ========================================================
    // MATERIALS
    // ========================================================

    materials: [
      {
        id: "MAT1",
        title: "Data Structures Notes",
        subject: "Data Structures",
        type: "PDF",
      },

      {
        id: "MAT2",
        title: "DBMS Notes",
        subject: "Database Management Systems",
        type: "PDF",
      },
    ],

    // ========================================================
    // NOTICES
    // ========================================================

    notices: [
      {
        id: "N1",
        title: "Mid Semester Examination Schedule",
        message:
          "The Mid Semester Examination schedule has been published. Students are requested to check the examination timetable.",
        audience: "Students",
        date: "2026-09-20",
        created_at: "2026-09-20",
      },

      {
        id: "N2",
        title: "Attendance Requirement",
        message:
          "Students are requested to maintain the required attendance percentage for the semester.",
        audience: "Students",
        date: "2026-09-18",
        created_at: "2026-09-18",
      },

      {
        id: "N3",
        title: "Assignment Submission",
        message:
          "Students must submit pending assignments before the respective due dates.",
        audience: "Students",
        date: "2026-09-16",
        created_at: "2026-09-16",
      },

      {
        id: "N4",
        title: "Parent Meeting",
        message:
          "The college will conduct a parent meeting this month.",
        audience: "Parents",
        date: "2026-09-15",
        created_at: "2026-09-15",
      },

      {
        id: "N5",
        title: "Faculty Meeting",
        message:
          "Faculty members are requested to attend the scheduled meeting.",
        audience: "Teachers",
        date: "2026-09-14",
        created_at: "2026-09-14",
      },
    ],

    // ========================================================
    // LEAVE / MODIFICATION REQUESTS
    // ========================================================

    leaves: [
      { id: "L1", applicant: "Dr. Priya Rao", applicant_email: "priya.rao@campusflow.edu", role: "Teacher", from_date: "2026-09-29", to_date: "2026-09-30", reason: "Personal work", status: "Pending", date: "2026-09-26" },
      { id: "L2", applicant: "Prof. Raj Kumar", applicant_email: "raj.kumar@campusflow.edu", role: "Teacher", from_date: "2026-10-02", to_date: "2026-10-02", reason: "Medical appointment", status: "Pending", date: "2026-09-25" },
      { id: "L3", applicant: "Dr. Priya Rao", applicant_email: "priya.rao@campusflow.edu", role: "Teacher", from_date: "2026-09-18", to_date: "2026-09-18", reason: "Family function", status: "Approved", date: "2026-09-16" },
      { id: "L4", applicant: "Prof. Raj Kumar", applicant_email: "raj.kumar@campusflow.edu", role: "Teacher", from_date: "2026-09-12", to_date: "2026-09-12", reason: "Personal work", status: "Rejected", date: "2026-09-10" },
    ],

    // ========================================================
    // FEES
    // ========================================================

    fees: [
      {
        id: "F1",
        student_id: studentId,
        amount: 45000,
        status: "Paid",
        due_date: "2026-08-31",
      },
    ],

    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    notifications: [
      {
        id: "NT1",
        title: "New Examination Schedule",
        message:
          "The Mid Semester Examination schedule has been published.",
        read: false,
      },

      {
        id: "NT2",
        title: "Attendance Updated",
        message:
          "Dareddy.Nagashree's attendance records have been updated.",
        read: false,
      },
    ],

    // ========================================================
    // PARENT COMPLAINTS TO PRINCIPAL
    // ========================================================

    complaints: [
      {
        id: "CMP1",
        tracking_no: "CMP-2026-081",
        parent_id: "P1",
        parent_name: "Dareddy.Roja",
        parent_email: "roja123@campusflow.edu",
        parent_phone: "9052732998",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        student_class: "CSE - 3rd Year (Sec A)",
        category: "Infrastructure",
        priority: "High",
        subject: "Frequent AC breakdown in 3rd Year CSE Lab 2",
        description: "In the Computer Science Lab 2, the air conditioning units have not been functioning properly for the last two weeks, making it uncomfortable for students during 3-hour afternoon practical coding sessions. Requesting prompt maintenance.",
        to_authority: "Principal",
        status: "Resolved",
        created_at: "2026-09-20",
        principal_response: "Thank you for bringing this to our attention. Our campus facilities team has serviced and replaced the compressor in CS Lab 2 on Sep 22nd. The temperature controls have been verified.",
        responded_at: "2026-09-22",
        responded_by: "Dr. Nagashree (Principal)",
        action_taken: "Maintenance team replaced compressor unit & air filters.",
        is_anonymous: false,
        satisfaction_rating: 5,
      },
      {
        id: "CMP2",
        tracking_no: "CMP-2026-094",
        parent_id: "P1",
        parent_name: "Dareddy.Roja",
        parent_email: "roja123@campusflow.edu",
        parent_phone: "9052732998",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        student_class: "CSE - 3rd Year (Sec A)",
        category: "Academics",
        priority: "Normal",
        subject: "Request for extra tutorial & doubt clearing sessions in Operating Systems",
        description: "Several students in Section A found the recent OS core topics like memory paging and concurrency tricky in the Mid Semester assessments. Could the department arrange weekend remedial / doubt classes before the finals?",
        to_authority: "Principal",
        status: "In Progress",
        created_at: "2026-09-24",
        principal_response: "Forwarded directly to Prof. Priya Rao (HOD CSE). Special tutorial hours have been scheduled every Saturday from 10:00 AM to 12:00 PM starting next week.",
        responded_at: "2026-09-25",
        responded_by: "Dr. Nagashree (Principal)",
        action_taken: "CSE Department scheduled Saturday tutorial classes.",
        is_anonymous: false,
      },
      {
        id: "CMP3",
        tracking_no: "CMP-2026-102",
        parent_id: "P1",
        parent_name: "Dareddy.Roja",
        parent_email: "roja123@campusflow.edu",
        parent_phone: "9052732998",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        student_class: "CSE - 3rd Year (Sec A)",
        category: "Canteen & Hygiene",
        priority: "Urgent",
        subject: "Drinking water dispenser filter cartridge replacement in Block B",
        description: "The drinking water RO dispenser on the 2nd floor near Room 204 requires filter cartridge replacement and routine sanitation audit.",
        to_authority: "Principal",
        status: "Under Review",
        created_at: "2026-09-27",
        principal_response: "",
        responded_at: "",
        responded_by: "",
        action_taken: "",
        is_anonymous: false,
      },
    ],

    // ========================================================
    // PARENT REQUESTS TO PRINCIPAL & ADMINISTRATION
    // ========================================================

    requests: [
      {
        id: "REQ1",
        tracking_no: "REQ-2026-042",
        parent_id: "P1",
        parent_name: "Dareddy.Roja",
        parent_email: "roja123@campusflow.edu",
        parent_phone: "9052732998",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        student_class: "CSE - 3rd Year (Sec A)",
        request_type: "Bonafide Certificate",
        subject: "Bonafide Certificate for National Merit Scholarship",
        details: "Required for submitting the State Merit Scholarship online renewal portal by Oct 10th.",
        purpose: "National / State Merit Scholarship Renewal",
        status: "Approved",
        created_at: "2026-09-22",
        principal_remarks: "Approved. Official digital bonafide certificate generated with Principal's seal.",
        decided_at: "2026-09-23",
        decided_by: "Dr. Nagashree (Principal)",
        certificate_ready: true,
      },
      {
        id: "REQ2",
        tracking_no: "REQ-2026-055",
        parent_id: "P1",
        parent_name: "Dareddy.Roja",
        parent_email: "roja123@campusflow.edu",
        parent_phone: "9052732998",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        student_class: "CSE - 3rd Year (Sec A)",
        request_type: "PTM with Principal",
        subject: "In-person meeting regarding Career Pathways & Placement Prep",
        details: "Requesting a 15-minute appointment with the Principal to discuss GRE preparation alongside upcoming campus recruitment drives.",
        meeting_preferred_date: "2026-10-04",
        meeting_time_slot: "03:30 PM - 04:00 PM",
        purpose: "Placement Guidance & Higher Studies",
        status: "Approved",
        created_at: "2026-09-25",
        principal_remarks: "Confirmed appointment on Friday, Oct 4th at 03:30 PM in Principal's Chamber.",
        decided_at: "2026-09-26",
        decided_by: "Dr. Nagashree (Principal)",
      },
      {
        id: "REQ3",
        tracking_no: "REQ-2026-068",
        parent_id: "P1",
        parent_name: "Dareddy.Roja",
        parent_email: "roja123@campusflow.edu",
        parent_phone: "9052732998",
        student_id: studentId,
        student_name: "Dareddy.Nagashree",
        student_class: "CSE - 3rd Year (Sec A)",
        request_type: "Leave Application",
        subject: "3-Day Leave for Family Wedding Ceremony (Oct 6 - Oct 8)",
        details: "Dareddy.Nagashree will need to attend an out-of-station family wedding. She will complete all pending assignments before departure.",
        from_date: "2026-10-06",
        to_date: "2026-10-08",
        purpose: "Family Wedding Ceremony",
        status: "Pending",
        created_at: "2026-09-28",
        principal_remarks: "Under review by Principal Office",
        decided_at: "",
        decided_by: "",
      },
    ],
    marks_modification_requests: [],
  };
}