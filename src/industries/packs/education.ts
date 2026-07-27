import type { IndustryPack } from "../industry-pack-schema.js";

export const educationPack = {
  "schemaVersion": "1.0",
  "id": "education",
  "name": "Education",
  "description": "Academic programs and enrollment operations for schools and training institutions.",
  "aliases": [
    "education",
    "school",
    "university",
    "academy",
    "enrollment",
    "آموزش",
    "دانشگاه",
    "مدرسه",
    "ثبت‌نام"
  ],
  "ceoConcerns": [
    {
      "id": "cc-enrollment",
      "title": "Enrollment targets",
      "description": "Hitting intake targets by program.",
      "priority": "HIGH"
    },
    {
      "id": "cc-retention",
      "title": "Student retention",
      "description": "Reducing dropouts mid-term.",
      "priority": "HIGH"
    },
    {
      "id": "cc-quality",
      "title": "Academic quality",
      "description": "Maintaining outcomes and accreditation standards.",
      "priority": "HIGH"
    },
    {
      "id": "cc-collections",
      "title": "Tuition collections",
      "description": "Reducing overdue tuition balances.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-capacity",
      "title": "Classroom capacity",
      "description": "Matching sections to demand.",
      "priority": "MEDIUM"
    }
  ],
  "kpis": [
    {
      "id": "kpi-enrollment",
      "name": "Enrollment fill rate",
      "description": "Seats filled versus capacity.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "admissions"
    },
    {
      "id": "kpi-yield",
      "name": "Admissions yield",
      "description": "Enrolled versus accepted.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "admissions"
    },
    {
      "id": "kpi-retention",
      "name": "Retention rate",
      "description": "Students retained term-over-term.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "student-success"
    },
    {
      "id": "kpi-graduation",
      "name": "Graduation rate",
      "description": "On-time graduation percent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "academic"
    },
    {
      "id": "kpi-attendance",
      "name": "Attendance rate",
      "description": "Sessions attended versus expected.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "academic"
    },
    {
      "id": "kpi-gpa",
      "name": "Average GPA",
      "description": "Mean GPA across active students.",
      "unit": "SCORE",
      "direction": "HIGHER_IS_BETTER",
      "department": "academic"
    },
    {
      "id": "kpi-tuition-dso",
      "name": "Tuition DSO",
      "description": "Days to collect tuition.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-arrears",
      "name": "Tuition arrears",
      "description": "Overdue tuition balance.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-section-util",
      "name": "Section utilization",
      "description": "Enrollment versus section capacity.",
      "unit": "PERCENT",
      "direction": "TARGET",
      "department": "academic"
    },
    {
      "id": "kpi-nps",
      "name": "Student NPS",
      "description": "Student promoter score.",
      "unit": "SCORE",
      "direction": "HIGHER_IS_BETTER",
      "department": "student-success"
    }
  ],
  "departments": [
    {
      "id": "dept-admissions",
      "name": "Admissions",
      "description": "Recruiting and enrollment.",
      "core": true
    },
    {
      "id": "dept-academic",
      "name": "Academic Affairs",
      "description": "Programs, sections, faculty.",
      "core": true
    },
    {
      "id": "dept-student-success",
      "name": "Student Success",
      "description": "Retention and advising.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Tuition and aid.",
      "core": true
    },
    {
      "id": "dept-registrar",
      "name": "Registrar",
      "description": "Records and transcripts.",
      "core": true
    },
    {
      "id": "dept-ops",
      "name": "Campus Operations",
      "description": "Facilities and scheduling.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-admissions",
      "title": "Admissions Director",
      "departmentId": "dept-admissions",
      "description": "Owns intake funnel."
    },
    {
      "id": "role-dean",
      "title": "Academic Dean",
      "departmentId": "dept-academic",
      "description": "Owns programs and quality."
    },
    {
      "id": "role-advisor",
      "title": "Student Advisor",
      "departmentId": "dept-student-success",
      "description": "Owns retention caseload."
    },
    {
      "id": "role-bursar",
      "title": "Bursar",
      "departmentId": "dept-finance",
      "description": "Owns tuition billing."
    },
    {
      "id": "role-registrar",
      "title": "Registrar",
      "departmentId": "dept-registrar",
      "description": "Owns academic records."
    },
    {
      "id": "role-scheduler",
      "title": "Timetable Manager",
      "departmentId": "dept-ops",
      "description": "Owns room/section scheduling."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-apply",
      "name": "Application to enrollment",
      "department": "admissions",
      "purpose": "Convert applicants to enrolled students.",
      "trigger": "Application submitted",
      "stages": [
        "Screen",
        "Accept",
        "Deposit",
        "Enroll"
      ],
      "outputs": [
        "Enrollment record"
      ]
    },
    {
      "id": "wf-register",
      "name": "Course registration",
      "department": "registrar",
      "purpose": "Register students into sections.",
      "trigger": "Registration window",
      "stages": [
        "Open catalog",
        "Register",
        "Resolve conflicts",
        "Confirm"
      ],
      "outputs": [
        "Schedule"
      ]
    },
    {
      "id": "wf-attendance",
      "name": "Attendance tracking",
      "department": "academic",
      "purpose": "Capture and act on attendance.",
      "trigger": "Session start",
      "stages": [
        "Mark attendance",
        "Flag absences",
        "Notify advisor",
        "Intervene"
      ],
      "outputs": [
        "Attendance log"
      ]
    },
    {
      "id": "wf-grade",
      "name": "Grading & transcripts",
      "department": "registrar",
      "purpose": "Post grades and update transcripts.",
      "trigger": "Term end",
      "stages": [
        "Submit grades",
        "Validate",
        "Post",
        "Publish transcript"
      ],
      "outputs": [
        "Transcript update"
      ]
    },
    {
      "id": "wf-tuition",
      "name": "Tuition billing",
      "department": "finance",
      "purpose": "Bill and collect tuition.",
      "trigger": "Term billing date",
      "stages": [
        "Generate invoices",
        "Apply aid",
        "Collect",
        "Escalate"
      ],
      "outputs": [
        "Invoice",
        "Receipt"
      ]
    },
    {
      "id": "wf-retention",
      "name": "At-risk intervention",
      "department": "student-success",
      "purpose": "Intervene for at-risk students.",
      "trigger": "Risk flag",
      "stages": [
        "Identify",
        "Outreach",
        "Support plan",
        "Follow up"
      ],
      "outputs": [
        "Intervention case"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Institution Overview",
      "audience": [
        "President",
        "Dean"
      ],
      "purpose": "Enrollment, retention, collections.",
      "kpiIds": [
        "kpi-enrollment",
        "kpi-retention",
        "kpi-graduation",
        "kpi-arrears"
      ],
      "sections": [
        "Enrollment",
        "Outcomes",
        "Finance"
      ]
    },
    {
      "id": "dash-admissions",
      "name": "Admissions Funnel",
      "audience": [
        "Admissions"
      ],
      "purpose": "Yield and fill.",
      "kpiIds": [
        "kpi-enrollment",
        "kpi-yield"
      ],
      "sections": [
        "Funnel",
        "Programs"
      ]
    },
    {
      "id": "dash-academic",
      "name": "Academic Performance",
      "audience": [
        "Dean"
      ],
      "purpose": "GPA, attendance, utilization.",
      "kpiIds": [
        "kpi-gpa",
        "kpi-attendance",
        "kpi-section-util"
      ],
      "sections": [
        "Outcomes",
        "Capacity"
      ]
    },
    {
      "id": "dash-success",
      "name": "Student Success",
      "audience": [
        "Advisors"
      ],
      "purpose": "Retention and NPS.",
      "kpiIds": [
        "kpi-retention",
        "kpi-nps"
      ],
      "sections": [
        "At-risk",
        "Interventions"
      ]
    },
    {
      "id": "dash-finance",
      "name": "Tuition Collections",
      "audience": [
        "Bursar"
      ],
      "purpose": "DSO and arrears.",
      "kpiIds": [
        "kpi-tuition-dso",
        "kpi-arrears"
      ],
      "sections": [
        "Aging",
        "Cash"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-admissions",
      "name": "Admissions Yield Agent",
      "mission": "Planning record: suggest yield actions by program.",
      "permissions": "SUGGEST",
      "inputs": [
        "Applicants",
        "Capacity"
      ],
      "outputs": [
        "Yield plan"
      ],
      "department": "admissions"
    },
    {
      "id": "agent-retention",
      "name": "Retention Risk Agent",
      "mission": "Planning record: flag at-risk students for advisor review.",
      "permissions": "SUGGEST",
      "inputs": [
        "Attendance",
        "Grades"
      ],
      "outputs": [
        "Risk list"
      ],
      "department": "student-success"
    },
    {
      "id": "agent-timetable",
      "name": "Timetable Advisor",
      "mission": "Planning record: propose section/room allocations.",
      "permissions": "SUGGEST",
      "inputs": [
        "Demand",
        "Rooms"
      ],
      "outputs": [
        "Timetable draft"
      ],
      "department": "ops"
    },
    {
      "id": "agent-bursar",
      "name": "Tuition Collections Agent",
      "mission": "Planning record: prioritize arrears outreach.",
      "permissions": "SUGGEST",
      "inputs": [
        "Invoices"
      ],
      "outputs": [
        "Outreach queue"
      ],
      "department": "finance"
    },
    {
      "id": "agent-brief",
      "name": "Academic Briefing Agent",
      "mission": "Planning record: leadership KPI brief.",
      "permissions": "READ_ONLY",
      "inputs": [
        "KPIs"
      ],
      "outputs": [
        "Brief"
      ]
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-program",
        "name": "Program",
        "description": "Academic program.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          },
          {
            "name": "capacity",
            "type": "NUMBER",
            "required": true
          }
        ]
      },
      {
        "id": "ent-student",
        "name": "Student",
        "description": "Enrolled student.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          },
          {
            "name": "programId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-program"
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "APPLICANT",
              "ENROLLED",
              "GRADUATED",
              "WITHDRAWN"
            ]
          }
        ]
      },
      {
        "id": "ent-section",
        "name": "Section",
        "description": "Course section.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "programId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-program"
          },
          {
            "name": "code",
            "type": "STRING",
            "required": true
          },
          {
            "name": "capacity",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "term",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-enrollment",
        "name": "Enrollment",
        "description": "Student in section.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "studentId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-student"
          },
          {
            "name": "sectionId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-section"
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "REGISTERED",
              "DROPPED",
              "COMPLETED"
            ]
          }
        ]
      },
      {
        "id": "ent-invoice",
        "name": "TuitionInvoice",
        "description": "Tuition invoice.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "studentId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-student"
          },
          {
            "name": "amount",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "dueDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "PAID",
              "OVERDUE"
            ]
          }
        ]
      },
      {
        "id": "ent-attendance",
        "name": "AttendanceRecord",
        "description": "Session attendance.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "enrollmentId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-enrollment"
          },
          {
            "name": "sessionDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "present",
            "type": "BOOLEAN",
            "required": true
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-program",
        "toEntityId": "ent-student",
        "type": "ONE_TO_MANY",
        "description": "Program has students."
      },
      {
        "fromEntityId": "ent-program",
        "toEntityId": "ent-section",
        "type": "ONE_TO_MANY",
        "description": "Program has sections."
      },
      {
        "fromEntityId": "ent-student",
        "toEntityId": "ent-enrollment",
        "type": "ONE_TO_MANY",
        "description": "Student has enrollments."
      },
      {
        "fromEntityId": "ent-section",
        "toEntityId": "ent-enrollment",
        "type": "ONE_TO_MANY",
        "description": "Section has enrollments."
      },
      {
        "fromEntityId": "ent-student",
        "toEntityId": "ent-invoice",
        "type": "ONE_TO_MANY",
        "description": "Student has invoices."
      },
      {
        "fromEntityId": "ent-enrollment",
        "toEntityId": "ent-attendance",
        "type": "ONE_TO_MANY",
        "description": "Enrollment has attendance."
      }
    ]
  },
  "terminology": {
    "GPA": [
      "Grade Point Average"
    ],
    "Yield": [
      "Admissions yield"
    ],
    "Registrar": [
      "Academic records office",
      "آموزش"
    ],
    "Section": [
      "Course section",
      "کلاس"
    ]
  },
  "risks": [
    "Over-enrollment without faculty capacity harms quality.",
    "Tuition arrears create cash strain.",
    "At-risk students need human advisor oversight before automated outreach at scale."
  ],
  "recommendedIntegrations": [
    {
      "name": "SIS",
      "category": "core",
      "purpose": "Students, sections, grades."
    },
    {
      "name": "LMS",
      "category": "academic",
      "purpose": "Attendance and coursework."
    },
    {
      "name": "Payments",
      "category": "finance",
      "purpose": "Tuition collection."
    },
    {
      "name": "CRM",
      "category": "admissions",
      "purpose": "Applicant funnel."
    }
  ]
} satisfies IndustryPack;
