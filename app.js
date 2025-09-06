// DRE MVP Prototype - Plain JS SPA with hash routing and mock data
// Now using a separate JSON file for user data for easier management

// Router
const routeRegistry = {};
function registerRoute(path, renderFn) { routeRegistry[path] = renderFn; }
function navigate(path) { window.location.hash = `#${path}`; }
function getPath() { return window.location.hash.replace(/^#/, '') || 'login'; }

// App bootstrap
const app = document.getElementById('app');

// Add CSS for equal height cards
const style = document.createElement('style');
style.textContent = `
  .home-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 200px;
  }
  
  .home-card .spacer {
    flex-grow: 1;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    align-items: stretch;
  }
  
  .grid-2-col {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    align-items: stretch;
  }
  
  .grid-3-col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    align-items: stretch;
  }
  
  .grid-4-col {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    align-items: stretch;
  }
  
  @media (max-width: 768px) {
    .grid-2-col,
    .grid-3-col,
    .grid-4-col {
      grid-template-columns: 1fr;
    }
  }
  
  .btn.pill.selected {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
`;
document.head.appendChild(style);

// Global state
let state = {
  user: null, // {id, role: 'admin'|'mentor'|'student', email, name}
  files: {}, // temporary uploads keyed by token
  credits: {
    admin: { totalGranted: 1200 },
    mentor: { balance: 200 },
    student: { balance: 100 }
  },
  mock: {
    users: [], // Will be loaded from users.json
    agenda: JSON.parse(localStorage.getItem('agenda')) || [
      { id: 'ag1', date: '2025-09-12', title: 'Kickoff', time: '10:00', room: 'Main', status: 'Scheduled' },
      { id: 'ag2', date: '2025-09-13', title: 'Mentor Sync', time: '14:00', room: 'A2', status: 'Scheduled' },
    ],
    challenges: JSON.parse(localStorage.getItem('challenges')) || [
      { id: 'c1', title: 'Responsive Landing', description: 'Design and code a responsive landing page.', credits: 50, deadline: '2025-09-10' },
      { id: 'c2', title: 'Auth Microservice', description: 'Build a secure authentication microservice.', credits: 80, deadline: '2025-09-22' },
      { id: 'c3', title: 'API Integration', description: 'Create API endpoints and integrate with frontend.', credits: 60, deadline: '2025-09-28' },
      { id: 'c4', title: 'Component Library', description: 'Build a reusable component library.', credits: 70, deadline: '2025-10-05' },
    ],
    assignments: JSON.parse(localStorage.getItem('assignments')) || [
      { id: 'a1', title: 'Week 1: HTML/CSS', description: 'Complete the HTML and CSS exercises.', mentor: 'Mentor User', deadline: '2025-09-18', credits: 50 },
      { id: 'a2', title: 'Week 2: JavaScript', description: 'Solve basic JavaScript problems.', mentor: 'Mentor User', deadline: '2025-09-25', credits: 75 },
      { id: 'a3', title: 'Week 3: React', description: 'Build React components and applications.', mentor: 'Mentor User', deadline: '2025-10-02', credits: 100 },
    ],
    submissions: JSON.parse(localStorage.getItem('submissions')) || [
      { 
        id: 's1', team: 'Team Alpha', assignment: 'Week 1: HTML/CSS', challenge: 'Responsive Landing', by: 'Alice', at: '2025-09-01 12:00 PM', status: 'Submitted', grade: null, files: [
          { name: 'index.html', size: '2.5KB' },
          { name: 'styles.css', size: '1.2KB' }
        ]
      },
      { 
        id: 's2', team: 'Team Beta', assignment: 'Week 2: JS Basics', challenge: 'Auth Microservice', by: 'Bob', at: '2025-09-02 10:00 AM', status: 'Pending', grade: null, files: [
          { name: 'main.js', size: '5.8KB' },
          { name: 'server.js', size: '3.1KB' },
        ]
      },
      { 
        id: 's3', team: 'Team Gamma', assignment: 'Week 1: HTML/CSS', challenge: 'Database Design', by: 'Charlie', at: '2025-09-03 09:15 AM', status: 'Submitted', grade: null, files: [
          { name: 'schema.sql', size: '0.9KB' },
        ]
      },
      { 
        id: 's4', team: 'Team Alpha', assignment: 'Week 2: JavaScript', challenge: 'API Integration', by: 'Jane', at: '2025-09-04 14:30 PM', status: 'Submitted', grade: null, files: [
          { name: 'app.js', size: '3.2KB' },
          { name: 'api.js', size: '1.8KB' }
        ]
      },
      { 
        id: 's5', team: 'Team Alpha', assignment: 'Week 3: React', challenge: 'Component Library', by: 'Kong', at: '2025-09-05 09:45 AM', status: 'Submitted', grade: null, files: [
          { name: 'components.jsx', size: '4.1KB' },
          { name: 'styles.css', size: '2.3KB' }
        ]
      },
    ],
    redeems: JSON.parse(localStorage.getItem('redeems')) || [],
  }
};

// --- Data loading function ---
async function loadData() {
  try {
    const response = await fetch('users.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    state.mock.users = await response.json();
  } catch (e) {
    console.error('Failed to load users.json:', e);
    state.mock.users = [
      { id: 'admin-01', role: 'admin', email: 'admin@example.com', password: 'password', name: 'Admin User' },
      { id: 'mentor-01', role: 'mentor', email: 'mentor@example.com', password: 'password', name: 'Mentor User' },
      { id: 'student-01', role: 'student', email: 'student@example.com', password: 'password', name: 'Student User' },
    ];
  }
}

// --- Utility Functions ---
function h(tag, props, children) {
  const element = document.createElement(tag);
  for (const key in props) {
    if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else {
      element.setAttribute(key, props[key]);
    }
  }
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child) {
        element.appendChild(child);
      }
    });
  } else if (typeof children === 'string' || typeof children === 'number') {
    element.appendChild(document.createTextNode(children));
  }
  return element;
}

// Grading modal function
function showGradingModal(submission) {
  let selectedOverallComment = '';
  let selectedScore = '';
  
  // Rubric score options
  const rubricOptions = [
    { value: 'improve', label: 'ปรับปรุง', color: 'danger' },
    { value: 'fair', label: 'พอใช้', color: 'warn' },
    { value: 'good', label: 'ดี', color: 'ok' },
    { value: 'excellent', label: 'ดีเยี่ยม', color: 'ok' }
  ];
  
  const submitGrade = () => {
    if (!selectedOverallComment || !selectedScore) {
      alert('Please select both overall comment and score.');
      return;
    }
    
    const comment = document.getElementById('grade-comment').value;
    
    // Update submission with grade
    const submissionIndex = state.mock.submissions.findIndex(s => s.id === submission.id);
    if (submissionIndex !== -1) {
      state.mock.submissions[submissionIndex].status = 'Graded';
      state.mock.submissions[submissionIndex].grade = {
        overallComment: selectedOverallComment,
        score: selectedScore,
        comment: comment,
        gradedBy: state.user.name,
        gradedAt: new Date().toLocaleString()
      };
      
      // Award credits to student
      const studentUser = state.mock.users.find(u => u.name === submission.by);
      if (studentUser) {
        const creditsToAward = selectedScore === 'excellent' ? 10 : selectedScore === 'good' ? 8 : selectedScore === 'fair' ? 5 : 2;
        if (!studentUser.credits) studentUser.credits = 100;
        studentUser.credits += creditsToAward;
        localStorage.setItem('users', JSON.stringify(state.mock.users));
      }
      
      localStorage.setItem('submissions', JSON.stringify(state.mock.submissions));
    }
    
    alert('Grade submitted successfully!');
    hideModal();
    // Refresh the submissions page
    renderMentorSubmissions();
  };
  
  const modalContent = h('div', { style: 'max-width: 1000px; width: 95vw; max-height: 90vh; overflow-y: auto;' }, [
    h('div', { style: 'display: flex; gap: 20px; min-height: 500px;' }, [
      // Left panel - Submission details
      h('div', { style: 'flex: 1; background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); min-width: 300px;' }, [
        h('h2', { style: 'margin: 0 0 16px 0;' }, submission.assignment || submission.challenge || 'Submission'),
        h('div', { class: 'muted', style: 'margin-bottom: 20px;' }, `Submitted by ${submission.by} (${submission.team}) on ${submission.at}`),
        
        h('div', { style: 'margin-bottom: 16px;' }, [
          h('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500;' }, 'ไฟล์แนบ (Attached Files)'),
          h('div', { class: 'muted', style: 'margin-bottom: 8px;' }, submission.files ? submission.files.map(f => f.name).join(', ') : 'No files'),
          h('div', { style: 'display: flex; gap: 8px;' }, 
            (submission.files || []).map(file => 
              h('div', { 
                style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' 
              }, '📄')
            )
          )
        ])
      ]),
      
      // Right panel - Grading interface
      h('div', { style: 'flex: 2; background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border);' }, [
        h('div', { style: 'margin-bottom: 20px;' }, [
          h('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500;' }, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
          h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
        ]),
        
        h('div', { style: 'margin-bottom: 20px;' }, [
          h('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500;' }, 'ความเห็นรวม (Overall Comment)'),
          h('div', { style: 'display: flex; gap: 8px; flex-wrap: wrap;' }, 
            rubricOptions.map(option => 
              h('button', { 
                class: `btn pill ${option.color}`,
                style: 'margin-bottom: 8px;',
                onclick: (e) => {
                  e.target.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                  e.target.classList.add('selected');
                  selectedOverallComment = option.value;
                }
              }, option.label)
            )
          )
        ]),
        
        h('div', { style: 'margin-bottom: 20px;' }, [
          h('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500;' }, 'ให้คะแนน (Give Score)'),
          h('div', { style: 'display: flex; gap: 8px; flex-wrap: wrap;' }, 
            rubricOptions.map(option => 
              h('button', { 
                class: `btn pill ${option.color}`,
                style: 'margin-bottom: 8px;',
                onclick: (e) => {
                  e.target.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                  e.target.classList.add('selected');
                  selectedScore = option.value;
                }
              }, option.label)
            )
          )
        ]),
        
        h('div', { style: 'margin-bottom: 20px;' }, [
          h('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500;' }, 'Comment'),
          h('textarea', { 
            id: 'grade-comment',
            style: 'width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; resize: vertical; min-height: 80px;',
            placeholder: 'Comment...'
          })
        ]),
        
        h('button', { 
          class: 'btn primary', 
          style: 'width: 100%;',
          onclick: submitGrade 
        }, 'Submit Grade')
      ])
    ])
  ]);
  
  showModal(modalContent);
}


// Simple modal
let currentModal = null;
function showModal(content) {
  const backdrop = h('div', { 
    class: 'modal-backdrop',
    onclick: (e) => {
      if (e.target === backdrop) {
        hideModal();
      }
    }
  }, [
    h('div', { class: 'modal' }, [
      h('button', { 
        class: 'modal-close',
        onclick: hideModal,
        style: 'position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); z-index: 10;'
      }, '×'),
      content
    ])
  ]);
  document.body.appendChild(backdrop);
  setTimeout(() => backdrop.classList.add('show'), 10);
  currentModal = backdrop;
}
function hideModal() {
  if (currentModal) {
    currentModal.classList.remove('show');
    setTimeout(() => {
      if (currentModal && currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
      }
      currentModal = null;
    }, 300);
  }
}

// --- Views/Pages ---
function layout(title, actions, content) {
  const nav = h('div', { class: 'nav' }, [
    h('div', { class: 'brand' }, [
      h('img', { 
        src: 'visionary-logo.png', 
        alt: 'Visionary Logo', 
        style: 'height: 40px;'
      }),
      h('div', {}, [
        'VISIONARY ',
        h('small', {}, title ? ` / ${title}` : '')
      ])
    ]),
    h('div', { class: 'nav-actions' }, actions || [])
  ]);
  const container = h('div', { class: 'container' }, [nav, content]);
  app.innerHTML = '';
  app.appendChild(container);
}

// Student Dashboard View
function renderStudentDashboard() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: logout }, 'Log out')
  ];

  const content = h('div', { class: 'grid' }, [
    h('div', { class: 'card home-card', onclick: () => navigate('student-challenges') }, [
      h('h2', {}, 'Challenges'),
      h('div', { class: 'muted' }, 'View and submit challenges'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary' }, 'Open')
    ]),
    h('div', { class: 'card home-card', onclick: () => navigate('student-announcements') }, [
      h('h2', {}, 'Announcements'),
      h('div', { class: 'muted' }, 'See updates and details'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary' }, 'Open')
    ]),
    h('div', { class: 'card home-card', onclick: () => navigate('student-assignments') }, [
      h('h2', {}, 'Assignments'),
      h('div', { class: 'muted' }, 'Submit classroom assignments'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary' }, 'Open')
    ]),
    h('div', { class: 'card home-card', onclick: () => navigate('student-credits') }, [
      h('h2', {}, 'Credits Wallet'),
      h('div', { class: 'muted' }, 'View and redeem credits'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary' }, 'Open')
    ]),
  ]);

  layout('Student Dashboard', navActions, content);
}

// Mentor Dashboard View
function renderMentorDashboard() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: logout }, 'Log out')
  ];

  // Get mentor's team from user data
  const mentorTeam = state.user.team;
  const teamMembers = state.mock.users.filter(u => u.team === mentorTeam && u.role === 'student');
  const teamSubmissions = state.mock.submissions.filter(s => s.team === mentorTeam);
  const pendingSubmissions = teamSubmissions.filter(s => s.status === 'Submitted');

  const kpis = h('div', { class: 'kpis' }, [
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Team Members'),
      h('p', {}, teamMembers.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Pending Submissions'),
      h('p', {}, pendingSubmissions.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Total Submissions'),
      h('p', {}, teamSubmissions.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Team'),
      h('p', {}, mentorTeam)
    ]),
  ]);

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, `Hello, Mentor ${state.user.name}!`),
        h('div', { class: 'muted' }, `Your DRE Mentor Dashboard - ${mentorTeam}`)
      ])
    ]),
    h('div', { class: 'spacer-lg' }),
    kpis,
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'grid' }, [
      h('div', { class: 'card home-card', onclick: () => navigate('mentor-agenda') }, [
        h('h2', {}, 'Agenda'),
        h('div', { class: 'muted' }, 'View program agenda'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('mentor-challenges') }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'View challenges posted by admin'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('mentor-assignments') }, [
        h('h2', {}, 'Assignments'),
        h('div', { class: 'muted' }, 'View assignments posted by admin'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('mentor-submissions') }, [
        h('h2', {}, 'View Submissions'),
        h('div', { class: 'muted' }, 'Review student submissions'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('mentor-credits') }, [
        h('h2', {}, 'Give Credits'),
        h('div', { class: 'muted' }, 'Give mentor-specific credits'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
    ])
  ]);

  layout('Mentor Dashboard', navActions, content);
}

// Admin Dashboard View
function renderAdminDashboard() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: logout }, 'Log out')
  ];
  const kpis = h('div', { class: 'kpis' }, [
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Agenda Items'),
      h('p', {}, state.mock.agenda.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Submissions'),
      h('p', {}, state.mock.submissions.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Assignments'),
      h('p', {}, state.mock.assignments.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Credits'),
      h('p', {}, `Ξ ${state.credits.admin.totalGranted}`)
    ]),
  ]);
  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, `Hello, Admin ${state.user.name}!`),
        h('div', { class: 'muted' }, 'Your DRE Admin Dashboard')
      ])
    ]),
    h('div', { class: 'spacer-lg' }),
    kpis,
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'grid' }, [
      h('div', { class: 'card home-card', onclick: () => navigate('agenda') }, [
        h('h2', {}, 'Agenda'),
        h('div', { class: 'muted' }, 'View program agenda'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('challenges/manage') }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'Create, edit and manage challenges'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('assignments/manage') }, [
        h('h2', {}, 'Manage Assignments'),
        h('div', { class: 'muted' }, 'Create and edit assignments'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('credits/give') }, [
        h('h2', {}, 'Give Credits'),
        h('div', { class: 'muted' }, 'Grant credits to users'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
    ]),
  ]);
  layout('Admin Dashboard', navActions, content);
}

// Home page router that directs users to the correct dashboard based on their role
function renderHomePage() {
  if (!state.user) {
    navigate('login');
    return;
  }

  switch (state.user.role) {
    case 'admin':
      renderAdminDashboard();
      break;
    case 'mentor':
      renderMentorDashboard();
      break;
    case 'student':
      renderStudentDashboard();
      break;
    default:
      navigate('login');
  }
}

// --- New Admin Views ---
function renderAdminAgenda() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back'),
    h('button', { class: 'btn primary', onclick: () => showModal(h('div', {}, 'Create New Agenda Item Form')) }, 'New Agenda')
  ];
  
  const agendaList = h('div', { class: 'list' }, state.mock.agenda.map(item =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, `${item.title} • ${item.time}`),
        h('div', { class: 'meta' }, `${item.date} • ${item.room}`)
      ]),
      h('div', { class: 'pill ok' }, item.status)
    ])
  ));

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Agenda'),
      ])
    ]),
    h('div', { class: 'spacer' }),
    agendaList
  ]);
  layout('Agenda', navActions, content);
}

// --- Challenges Functions ---
function renderManageChallenges() {
  const challengeList = h('div', { class: 'list' }, state.mock.challenges.map(c =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, c.title),
        h('div', { class: 'meta' }, `Due ${c.deadline} • ${c.credits} points`)
      ]),
      // ปรับปรุงการจัดวางปุ่ม "View" และ "..." ให้อยู่ห่างกันและจัดกลาง
      h('div', { class: 'list-actions' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate(`challenges/edit/${c.id}`) }, 'Edit'),
        h('button', { class: 'btn ghost', onclick: () => {
          showModal(h('div', {}, [
            h('h2', {}, 'Delete Challenge'),
            h('p', {}, `Are you sure you want to delete "${c.title}"?`),
            h('div', { class: 'spacer' }),
            h('div', { class: 'row right' }, [
              h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
              h('button', { class: 'btn danger', onclick: () => {
                state.mock.challenges = state.mock.challenges.filter(item => item.id !== c.id);
                localStorage.setItem('challenges', JSON.stringify(state.mock.challenges));
                hideModal();
                render();
              }}, 'Delete')
            ])
          ]))
        }}, '...')
      ])
    ])
  ));
  
  const submissionsTable = h('table', { class: 'table' }, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, 'Team'),
        h('th', {}, 'Challenge'),
        h('th', {}, 'By'),
        h('th', {}, 'Submitted At'),
        h('th', {}, 'Status'),
        h('th', {}, 'Actions')
      ])
    ]),
    h('tbody', {}, state.mock.submissions.map(s => h('tr', {}, [
      h('td', {}, s.team),
      h('td', {}, s.challenge),
      h('td', {}, s.by),
      h('td', {}, s.at),
      h('td', {}, h('div', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status)),
      h('td', { style: 'text-align: right;' }, h('button', { class: 'btn ghost', onclick: () => navigate(`assignments/view/${s.id}`) }, 'Open'))
    ])))
  ]);

  let navActions = [
    h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back'),
    h('button', { class: 'btn primary', onclick: () => navigate('challenges/create') }, 'Add New Challenge')
  ];

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'Create and manage challenges')
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Challenges List'),
      h('div', { class: 'spacer' }),
      challengeList
    ]),
    h('div', { class: 'spacer-lg' }),
    h('h2', {}, 'Challenge Submissions'),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('div', { class: 'card-content-scroll' }, submissionsTable)
    ])
  ]);
  layout('Manage Challenges', navActions, content);
}

// ฟังก์ชันใหม่สำหรับหน้าแก้ไข Challenge โดยตรง
function renderEditChallenge(id) {
  const challenge = state.mock.challenges.find(c => c.id === id);
  if (!challenge) {
    navigate('challenges/manage');
    return;
  }

  const updateChallenge = (e) => {
    e.preventDefault();
    const form = e.target;
    const index = state.mock.challenges.findIndex(c => c.id === id);
    if (index !== -1) {
      state.mock.challenges[index] = {
        ...state.mock.challenges[index],
        title: form.title.value,
        description: form.description.value,
        credits: parseInt(form.points.value, 10),
        deadline: form.due_date.value,
      };
      localStorage.setItem('challenges', JSON.stringify(state.mock.challenges));
      navigate('challenges/manage');
      render();
    }
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Edit Challenge'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: updateChallenge }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true, value: challenge.title })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true, value: challenge.deadline })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Points *'),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1', value: challenge.credits })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Challenge description...', required: true }, challenge.description)
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Update Challenge')
      ])
    ])
  ]);
  layout('Edit Challenge', [h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage') }, 'Back')], content);
}

function renderCreateChallenge() {
  const save = (e) => {
    e.preventDefault();
    const form = e.target;
    const newItem = {
      id: `c${Date.now()}`,
      title: form.title.value,
      description: form.description.value,
      credits: parseInt(form.points.value, 10),
      deadline: form.due_date.value,
    };
    state.mock.challenges.push(newItem);
    localStorage.setItem('challenges', JSON.stringify(state.mock.challenges));
    navigate('challenges/manage');
    render();
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Create Challenge'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: save }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Points *'),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1' })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Challenge description...', required: true })
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Create Challenge')
      ])
    ])
  ]);
  layout('Create Challenge', [h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage') }, 'Back')], content);
}

// --- Assignments Functions ---
function renderManageAssignments() {
  const assignmentList = h('div', { class: 'list' }, state.mock.assignments.map(a =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, a.title),
        h('div', { class: 'meta' }, `Due ${a.deadline} • ${a.credits} credits`)
      ]),
      h('div', { class: 'list-actions' }, [
        // เปลี่ยนปุ่มจาก "View" เป็น "Edit" และลิงก์ไปยังหน้าแก้ไขที่สร้างใหม่
        h('button', { class: 'btn ghost', onclick: () => navigate(`assignments/edit/${a.id}`) }, 'Edit'),
        h('button', { class: 'btn ghost', onclick: () => {
          showModal(h('div', {}, [
            h('h2', {}, 'Delete Assignment'),
            h('p', {}, `Are you sure you want to delete "${a.title}"?`),
            h('div', { class: 'spacer' }),
            h('div', { class: 'row right' }, [
              h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
              h('button', { class: 'btn danger', onclick: () => {
                state.mock.assignments = state.mock.assignments.filter(item => item.id !== a.id);
                localStorage.setItem('assignments', JSON.stringify(state.mock.assignments));
                hideModal();
                render();
              }}, 'Delete')
            ])
          ]))
        }}, '...')
      ])
    ])
  ));

  const submissionsTable = h('table', { class: 'table' }, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, 'Team'),
        h('th', {}, 'Assignment'),
        h('th', {}, 'By'),
        h('th', {}, 'Submitted At'),
        h('th', {}, 'Status'),
        h('th', {}, 'Actions')
      ])
    ]),
    h('tbody', {}, state.mock.submissions.map(s => h('tr', {}, [
      h('td', {}, s.team),
      h('td', {}, s.assignment),
      h('td', {}, s.by),
      h('td', {}, s.at),
      h('td', {}, h('div', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status)),
      // ลิงก์ไปหน้าแสดง submission เพื่อดูไฟล์และให้คะแนน
      h('td', { style: 'text-align: right;' }, h('button', { class: 'btn ghost', onclick: () => navigate(`assignments/view/${s.id}`) }, 'View'))
    ])))
  ]);

  let navActions = [
    h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back'),
    h('button', { class: 'btn primary', onclick: () => navigate('assignments/create') }, 'Add New Assignment')
  ];

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Manage Assignments'),
        h('div', { class: 'muted' }, 'Create and manage assignments')
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Assignments List'),
      h('div', { class: 'spacer' }),
      assignmentList
    ]),
    h('div', { class: 'spacer-lg' }),
    h('h2', {}, 'Assignment Submissions'),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('div', { class: 'card-content-scroll' }, submissionsTable)
    ])
  ]);
  layout('Manage Assignments', navActions, content);
}

// ฟังก์ชันใหม่สำหรับหน้าแก้ไข Assignment โดยเฉพาะ
function renderEditAssignment(id) {
  const assignment = state.mock.assignments.find(a => a.id === id);
  if (!assignment) {
    navigate('assignments/manage');
    return;
  }

  const updateAssignment = (e) => {
    e.preventDefault();
    const form = e.target;
    const index = state.mock.assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      state.mock.assignments[index] = {
        ...state.mock.assignments[index],
        title: form.title.value,
        description: form.description.value,
        credits: parseInt(form.points.value, 10),
        deadline: form.due_date.value,
      };
      localStorage.setItem('assignments', JSON.stringify(state.mock.assignments));
      navigate('assignments/manage');
      render();
    }
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Edit Assignment'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: updateAssignment }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true, value: assignment.title })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true, value: assignment.deadline })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Credits *'),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1', value: assignment.credits })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Assignment description...', required: true }, assignment.description)
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate('assignments/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Update Assignment')
      ])
    ])
  ]);
  layout('Edit Assignment', [h('button', { class: 'btn ghost', onclick: () => navigate('assignments/manage') }, 'Back')], content);
}


// ฟังก์ชันใหม่สำหรับหน้าแสดง Submission เพื่อดูไฟล์และให้คะแนน
function renderViewAssignment(id) {
  const submission = state.mock.submissions.find(s => s.id === id);
  if (!submission) {
    navigate('assignments/manage');
    return;
  }

  const gradeSubmission = (e) => {
    e.preventDefault();
    const form = e.target;
    const newGrade = form.grade.value;
    const index = state.mock.submissions.findIndex(s => s.id === id);
    if (index !== -1) {
      state.mock.submissions[index].grade = newGrade;
      state.mock.submissions[index].status = 'Graded';
      // สมมติว่ามีระบบอัปเดต credits ให้ด้วย
      const studentUser = state.mock.users.find(u => u.name === submission.by);
      if (studentUser) {
        state.credits.student.balance += parseInt(newGrade, 10);
      }
      localStorage.setItem('submissions', JSON.stringify(state.mock.submissions));
      localStorage.setItem('credits', JSON.stringify(state.credits));
      hideModal();
      navigate('assignments/manage');
    }
  };

  const fileList = h('ul', { class: 'file-list' }, submission.files.map(file =>
    h('li', {}, [
      h('a', { href: '#', onclick: () => showModal(h('div', {}, `Viewing file: ${file.name}`)) }, file.name),
      h('span', { class: 'muted' }, ` (${file.size})`)
    ])
  ));

  const content = h('div', { class: 'card' }, [
    h('h2', {}, `Submission for "${submission.assignment}"`),
    h('div', { class: 'muted' }, `Submitted by ${submission.by} (${submission.team})`),
    h('div', { class: 'spacer' }),
    h('h3', {}, 'Attached Files'),
    h('div', { class: 'spacer-sm' }),
    fileList,
    h('div', { class: 'spacer-lg' }),
    h('h3', {}, 'Grade Submission'),
    h('div', { class: 'spacer-sm' }),
    h('form', { onsubmit: gradeSubmission }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Score'),
        h('input', { type: 'number', name: 'grade', class: 'input', required: true, min: '0', max: '100', value: submission.grade || '' })
      ]),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ok', type: 'submit' }, 'Submit Grade')
      ])
    ])
  ]);
  layout('View Assignment', [h('button', { class: 'btn ghost', onclick: () => navigate('assignments/manage') }, 'Back')], content);
}

function renderCreatePage(type) {
  const isAssignment = type === 'assignments';
  const save = (e) => {
    e.preventDefault();
    const form = e.target;
    const newItem = {
      id: `${isAssignment ? 'a' : 'c'}${Date.now()}`,
      title: form.title.value,
      description: form.description.value,
      credits: parseInt(form.points.value, 10),
      deadline: form.due_date.value,
      mentor: isAssignment ? state.user.name : undefined,
    };
    state.mock[isAssignment ? 'assignments' : 'challenges'].push(newItem);
    localStorage.setItem(isAssignment ? 'assignments' : 'challenges', JSON.stringify(state.mock[isAssignment ? 'assignments' : 'challenges']));
    navigate(isAssignment ? 'assignments/manage' : 'challenges/manage');
    render();
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, `Create ${isAssignment ? 'Assignment' : 'Challenge'}`),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: save }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, `Points / Credits *`),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1' })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Challenge description...', required: true })
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate(isAssignment ? 'assignments/manage' : 'challenges/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, `Create ${isAssignment ? 'Assignment' : 'Challenge'}`)
      ])
    ])
  ]);
  layout(`Create ${isAssignment ? 'Assignment' : 'Challenge'}`, [h('button', { class: 'btn ghost', onclick: () => navigate(isAssignment ? 'assignments/manage' : 'challenges/manage') }, 'Back')], content);
}


// --- Credits Functions ---
// ฟังก์ชันใหม่สำหรับหน้า Give Credits ตามดีไซน์ล่าสุด
function renderGiveCredits() {
  const giveCredits = (e) => {
    e.preventDefault();
    const form = e.target;
    const user = form.user_select.value;
    const credits = parseInt(form.credits_amount.value, 10);
    const reason = form.reason.value;

    const userToUpdate = state.mock.users.find(u => u.id === user);
    if (userToUpdate) {
      // Update specific user's credit balance
      if (userToUpdate.role === 'student') {
        if (!userToUpdate.credits) userToUpdate.credits = 100; // Initialize if not exists
        userToUpdate.credits += credits;
      } else if (userToUpdate.role === 'mentor') {
        if (!userToUpdate.credits) userToUpdate.credits = 200; // Initialize if not exists
        userToUpdate.credits += credits;
      }
      state.credits.admin.totalGranted += credits;

      // Add to credit history
      const creditHistory = JSON.parse(localStorage.getItem('creditHistory')) || [];
      creditHistory.push({
        id: `ch${Date.now()}`,
        userId: userToUpdate.id,
        userName: userToUpdate.name,
        change: credits,
        by: state.user.name,
        category: form.category_select.value || 'admin',
        reason: reason,
        timestamp: new Date().toLocaleString()
      });
      localStorage.setItem('creditHistory', JSON.stringify(creditHistory));

      // Save users data
      localStorage.setItem('users', JSON.stringify(state.mock.users));
      localStorage.setItem('credits', JSON.stringify(state.credits));

      showModal(h('div', {}, [
        h('h2', {}, 'สำเร็จ'),
        h('p', {}, `มอบเครดิตจำนวน ${credits} ให้กับ ${userToUpdate.name} เรียบร้อยแล้ว`),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'ตกลง')
      ]));
    }
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Give Credits'),
    h('div', { class: 'muted' }, 'Grant credits to any user in the system.'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: giveCredits }, [
      // จัด 4 ช่องให้อยู่ในบรรทัดเดียวกัน
      h('div', { class: 'grid-4-col' }, [
        h('div', { class: 'field' }, [
          h('label', {}, 'Team'),
          h('select', { class: 'input', name: 'team_select' }, [
            h('option', { value: '' }, 'Select Team...'),
            h('option', { value: 'team1' }, 'Team Alpha'),
            h('option', { value: 'team2' }, 'Team Beta')
          ])
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'User'),
          h('select', { class: 'input', name: 'user_select', required: true }, state.mock.users.map(u => h('option', { value: u.id }, `${u.name} (${u.role})`)))
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Category'),
          h('select', { class: 'input', name: 'category_select' }, [
            h('option', { value: '' }, 'Select Category...'),
            h('option', { value: 'assignment' }, 'Assignment'),
            h('option', { value: 'challenge' }, 'Challenge'),
            h('option', { value: 'bonus' }, 'Bonus')
          ])
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Amount'),
          h('input', { type: 'number', class: 'input', name: 'credits_amount', placeholder: 'e.g., 100', required: true, min: '1' })
        ])
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Reason'),
        h('textarea', { class: 'input', name: 'reason', placeholder: 'Reason for granting credits...', required: true })
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ok', type: 'submit' }, 'Grant Credits')
      ])
    ])
  ]);
  layout('Give Credits', [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')], content);
}


// --- Auth Views ---
function renderLoginPage() {
  const login = (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = state.mock.users.find(u => u.email === email && u.password === password);
    if (user) {
      state.user = user;
      navigate('home');
      render();
    } else {
      showModal(h('div', {}, [
        h('h2', {}, 'Login Failed'),
        h('p', {}, 'Invalid email or password.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
    }
  };

  const content = h('div', { class: 'login-container' }, [
    h('div', { class: 'card login-card' }, [
      h('div', { class: 'brand-logo' }, [
        h('img', { 
          src: 'visionary-logo.png', 
          alt: 'Visionary Logo', 
          style: 'height: 60px;'
        }),
        h('h1', {}, 'VISIONARY')
      ]),
      h('h2', {}, 'Welcome Back!'),
      h('p', { class: 'muted' }, 'Please login to your account'),
      h('div', { class: 'spacer' }),
      h('form', { onsubmit: login }, [
        h('div', { class: 'field' }, [
          h('label', {}, 'Email'),
          h('input', { type: 'email', id: 'email', class: 'input', placeholder: 'your@email.com', required: true })
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Password'),
          h('input', { type: 'password', id: 'password', class: 'input', placeholder: '********', required: true })
        ]),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', type: 'submit' }, 'Log In'),
        h('div', { class: 'spacer-lg' }),
        h('div', { class: 'muted', style: 'text-align: center;' }, [
          h('span', {}, `Don't have an account?`),
          h('a', { href: '#signup', style: 'margin-left: 5px; color: var(--accent); text-decoration: underline; cursor: pointer;' }, 'Sign Up here')
        ])
      ])
    ])
  ]);

  app.innerHTML = '';
  app.appendChild(content);
}

function renderSignupPage() {
  const signup = (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (state.mock.users.find(u => u.email === email)) {
      showModal(h('div', {}, [
        h('h2', {}, 'Sign Up Failed'),
        h('p', {}, 'This email is already registered.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'student',
    };
    
    state.mock.users.push(newUser);
    state.user = newUser;
    navigate('home');
    render();
  };

  const content = h('div', { class: 'login-container' }, [
    h('div', { class: 'card login-card' }, [
      h('div', { class: 'brand-logo' }, [
        h('img', { 
          src: 'visionary-logo.png', 
          alt: 'Visionary Logo', 
          style: 'height: 60px;'
        }),
        h('h1', {}, 'VISIONARY')
      ]),
      h('h2', {}, 'Create Your Account'),
      h('p', { class: 'muted' }, 'Join us in the DRE Platform!'),
      h('div', { class: 'spacer' }),
      h('form', { onsubmit: signup }, [
        h('div', { class: 'field' }, [
          h('label', {}, 'Your Name'),
          h('input', { type: 'text', id: 'name', class: 'input', placeholder: 'John Doe', required: true })
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Email'),
          h('input', { type: 'email', id: 'email', class: 'input', placeholder: 'your@email.com', required: true })
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Password'),
          h('input', { type: 'password', id: 'password', class: 'input', placeholder: '********', required: true })
        ]),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', type: 'submit' }, 'Sign Up'),
        h('div', { class: 'spacer-lg' }),
        h('div', { class: 'muted', style: 'text-align: center;' }, [
          h('span', {}, `Don't have an account?`),
          h('a', { href: '#login', style: 'margin-left: 5px; color: var(--accent); text-decoration: underline; cursor: pointer;' }, 'Log In here')
        ])
      ])
    ])
  ]);

  app.innerHTML = '';
  app.appendChild(content);
}

function logout() {
  state.user = null;
  navigate('login');
  render();
}

// --- Student Pages ---
function renderStudentChallenges() {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  // Get real student submissions from state
  const studentSubmissions = state.mock.submissions.filter(s => s.by === state.user.name);
  
  const challengesList = h('div', { class: 'list' }, state.mock.challenges.map(c => {
    const submission = studentSubmissions.find(s => s.challenge === c.title);
    const status = submission ? (submission.status === 'Graded' ? 'Graded' : 'Submitted') : 'Not Submitted';
    const statusColor = submission?.status === 'Graded' ? 'ok' : submission ? 'warn' : 'danger';
    
    return h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, c.title),
        h('div', { class: 'meta' }, `Due ${c.deadline} • ${c.credits} pts`)
      ]),
      h('div', { class: 'row' }, [
        h('span', { class: `pill ${statusColor}` }, status),
        h('button', { 
          class: 'btn', 
          onclick: () => {
            if (submission?.status === 'Graded') {
              navigate(`student-challenge-grade/${submission.id}`);
            } else {
              navigate(`student-challenge/${c.id}`);
            }
          }
        }, submission?.status === 'Graded' ? 'View Grade' : 'Open')
      ])
    ]);
  }));
  
  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'View and submit challenges')
      ])
    ]),
    h('div', { class: 'spacer' }),
    challengesList
  ]);
  
  layout('Challenges', actions, content);
}

function renderStudentChallenge(id) {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const challenge = state.mock.challenges.find(c => c.id === id);
  if (!challenge) {
    navigate('student-challenges');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('student-challenges') }, 'Back')];
  
  const filesInput = h('input', { type: 'file', multiple: true, class: 'input' });
  
  const submit = () => {
    if (filesInput.files.length === 0) {
      showModal(h('div', {}, [
        h('h2', {}, 'No Files Selected'),
        h('p', {}, 'Please select at least one file to submit.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }
    
    showModal(h('div', {}, [
      h('h2', {}, 'Confirm Submission'),
      h('p', {}, `Submit ${filesInput.files.length} file(s) for "${challenge.title}"?`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: () => {
          // Create new submission
          const newSubmission = {
            id: `s${Date.now()}`,
            team: state.user.team,
            challenge: challenge.title,
            by: state.user.name,
            at: new Date().toLocaleString(),
            status: 'Submitted',
            grade: null,
            files: Array.from(filesInput.files).map(file => ({
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)}KB`
            }))
          };
          
          // Add to submissions
          state.mock.submissions.push(newSubmission);
          localStorage.setItem('submissions', JSON.stringify(state.mock.submissions));
          
          alert('Submission sent successfully!');
          hideModal();
          navigate('student-challenges');
        }}, 'Submit')
      ])
    ]));
  };
  
  const content = h('div', { class: 'card' }, [
    h('h2', {}, challenge.title),
    h('div', { class: 'muted' }, `Due ${challenge.deadline}`),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'Attach File(s)'),
      filesInput
    ]),
    h('div', { class: 'spacer' }),
    h('button', { class: 'btn primary', onclick: submit }, 'Submit')
  ]);
  
  layout('Challenge Detail', actions, content);
}

function renderStudentAnnouncements() {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  // Load announcements from localStorage or use default
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [
    { id: 'a1', title: 'Welcome!', body: 'Kickoff is on Friday 10am, bring your laptops.', read: false },
    { id: 'a2', title: 'API Keys', body: 'Check your email for sandbox keys.', read: false },
  ];
  
  const all = announcements;
  const visible = all.slice(0, 5);
  const list = h('div', { class: 'list' }, visible.map(a =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, a.title),
        h('div', { class: 'meta' }, 'Tap for details')
      ]),
      h('div', { class: 'row' }, [
        h('span', { class: `pill ${a.read ? 'info' : 'warn'}` }, a.read ? 'Read' : 'Unread'),
        h('button', { class: 'btn', onclick: () => navigate(`student-announcement/${a.id}`) }, 'Open')
      ])
    ])
  ));
  
  const viewAll = all.length > 5 ? h('div', { class: 'list-actions' }, [
    h('button', { class: 'btn ghost', onclick: () => {
      list.innerHTML = '';
      all.forEach(a => list.appendChild(
        h('div', { class: 'list-item' }, [
          h('div', { class: 'ticket' }, [
            h('div', { class: 'title' }, a.title),
            h('div', { class: 'meta' }, 'Tap for details')
          ]),
          h('div', { class: 'row' }, [
            h('span', { class: `pill ${a.read ? 'info' : 'warn'}` }, a.read ? 'Read' : 'Unread'),
            h('button', { class: 'btn', onclick: () => navigate(`student-announcement/${a.id}`) }, 'Open')
          ])
        ])
      ));
    }}, 'View All')
  ]) : null;
  
  const content = h('div', {}, [list, viewAll]);
  layout('Announcements', actions, content);
}

function renderStudentAnnouncement(id) {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  // Load announcements from localStorage or use default
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [
    { id: 'a1', title: 'Welcome!', body: 'Kickoff is on Friday 10am, bring your laptops.', read: false },
    { id: 'a2', title: 'API Keys', body: 'Check your email for sandbox keys.', read: false },
  ];
  
  const announcement = announcements.find(a => a.id === id);
  if (!announcement) {
    navigate('student-announcements');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('student-announcements') }, 'Back')];
  
  const markRead = () => {
    announcement.read = true;
    // Save to localStorage
    localStorage.setItem('announcements', JSON.stringify(announcements));
    showModal(h('div', {}, [
      h('h2', {}, 'Marked as Read'),
      h('p', {}, 'This announcement has been marked as read.'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: () => {
        hideModal();
        // Re-render the page to update the UI
        renderStudentAnnouncement(id);
      }}, 'OK')
    ]));
  };
  
  const content = h('div', { class: 'card' }, [
    h('h2', {}, announcement.title),
    h('div', { class: 'spacer' }),
    h('div', {}, announcement.body),
    h('div', { class: 'spacer' }),
    h('div', { class: 'row right' }, [
      h('span', { class: `pill ${announcement.read ? 'info' : 'warn'}` }, announcement.read ? 'Read' : 'Unread'),
      h('button', { class: 'btn primary', onclick: markRead }, 'Mark as Read')
    ])
  ]);
  
  layout('Announcement Detail', actions, content);
}

function renderStudentAssignments() {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  // Get real student submissions from state
  const studentSubmissions = state.mock.submissions.filter(s => s.by === state.user.name);
  
  const assignmentsList = h('div', { class: 'list' }, state.mock.assignments.map(a => {
    const submission = studentSubmissions.find(s => s.assignment === a.title);
    const status = submission ? (submission.status === 'Graded' ? 'Graded' : 'Submitted') : 'Not Submitted';
    const statusColor = submission?.status === 'Graded' ? 'ok' : submission ? 'warn' : 'danger';
    
    return h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, a.title),
        h('div', { class: 'meta' }, `Due ${a.deadline} • ${a.credits} credits`)
      ]),
      h('div', { class: 'row' }, [
        h('span', { class: `pill ${statusColor}` }, status),
        h('button', { 
          class: 'btn', 
          onclick: () => {
            if (submission?.status === 'Graded') {
              navigate(`student-assignment-grade/${submission.id}`);
            } else {
              navigate(`student-assignment/${a.id}`);
            }
          }
        }, submission?.status === 'Graded' ? 'View Grade' : 'Open')
      ])
    ]);
  }));
  
  const content = h('div', {}, [assignmentsList]);
  layout('Assignments', actions, content);
}

function renderStudentAssignment(id) {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const assignment = state.mock.assignments.find(a => a.id === id);
  if (!assignment) {
    navigate('student-assignments');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('student-assignments') }, 'Back')];
  
  // Assignment logo placeholder
  const assignmentLogo = h('div', { 
    class: 'assignment-logo',
    style: 'width: 80px; height: 80px; border: 2px solid var(--border); border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); font-size: 24px; color: var(--muted);'
  }, '📝');
  
  // Assignment header section
  const assignmentHeader = h('div', { class: 'row', style: 'align-items: flex-start; gap: 16px;' }, [
    assignmentLogo,
    h('div', { style: 'flex: 1;' }, [
      h('h2', { style: 'margin: 0 0 8px 0;' }, assignment.title),
      h('div', { class: 'muted', style: 'line-height: 1.5;' }, 
        assignment.description || 'Complete this assignment according to the requirements. Submit your work before the due date.')
    ])
  ]);
  
  // File display section
  const fileDisplay = h('div', { class: 'field' }, [
    h('label', {}, 'File'),
    h('div', { 
      class: 'file-display',
      style: 'padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elevated); display: flex; align-items: center; gap: 8px;'
    }, [
      h('span', { style: 'font-size: 16px;' }, '📄'),
      h('span', {}, 'Example.txt')
    ])
  ]);
  
  // Upload area
  const uploadArea = h('div', { 
    class: 'upload-area',
    style: 'border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; background: var(--bg-elevated); cursor: pointer; transition: all 0.2s ease;',
    onclick: () => document.getElementById('file-upload').click()
  }, [
    h('div', { style: 'font-size: 24px; margin-bottom: 8px;' }, '📁'),
    h('div', { class: 'muted' }, 'Upload File')
  ]);
  
  const filesInput = h('input', { 
    type: 'file', 
    multiple: true, 
    id: 'file-upload',
    style: 'display: none;',
    onchange: (e) => {
      const uploadArea = document.querySelector('.upload-area');
      if (e.target.files.length > 0) {
        uploadArea.innerHTML = `
          <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
          <div class="muted">${e.target.files.length} file(s) selected</div>
        `;
        uploadArea.style.borderColor = 'var(--accent)';
        uploadArea.style.background = 'var(--bg-elevated)';
      }
    }
  });
  
  const submit = () => {
    const files = document.getElementById('file-upload').files;
    if (files.length === 0) {
      showModal(h('div', {}, [
        h('h2', {}, 'No Files Selected'),
        h('p', {}, 'Please select at least one file to submit.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }
    
    showModal(h('div', {}, [
      h('h2', {}, 'Submit Assignment'),
      h('p', {}, `Submit ${files.length} file(s) for "${assignment.title}"?`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: () => {
          // Create new submission
          const newSubmission = {
            id: `s${Date.now()}`,
            team: state.user.team,
            assignment: assignment.title,
            by: state.user.name,
            at: new Date().toLocaleString(),
            status: 'Submitted',
            grade: null,
            files: Array.from(files).map(file => ({
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)}KB`
            }))
          };
          
          // Add to submissions
          state.mock.submissions.push(newSubmission);
          localStorage.setItem('submissions', JSON.stringify(state.mock.submissions));
          
          alert('Assignment submitted successfully!');
          hideModal();
          navigate('student-assignments');
        }}, 'Submit')
      ])
    ]));
  };
  
  const content = h('div', { class: 'card' }, [
    assignmentHeader,
    h('div', { class: 'spacer-lg' }),
    fileDisplay,
    h('div', { class: 'spacer' }),
    uploadArea,
    filesInput,
    h('div', { class: 'spacer-lg' }),
    h('button', { class: 'btn primary', onclick: submit }, 'Submit')
  ]);
  
  layout('Assignment Detail', actions, content);
}

function renderStudentAssignmentGrade(id) {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('student-assignments') }, 'Back')];
  
  // Get real submission data
  const submission = state.mock.submissions.find(s => s.id === id);
  if (!submission || !submission.grade) {
    navigate('student-assignments');
    return;
  }
  
  const gradeData = {
    assignment: submission.assignment || submission.challenge,
    submittedBy: submission.by,
    team: submission.team,
    submittedAt: submission.at,
    overallComment: submission.grade.overallComment,
    score: submission.grade.score,
    comment: submission.grade.comment,
    gradedBy: submission.grade.gradedBy,
    gradedAt: submission.grade.gradedAt
  };
  
  // Rubric score options
  const rubricOptions = [
    { value: 'improve', label: 'ปรับปรุง', color: 'danger' },
    { value: 'fair', label: 'พอใช้', color: 'warn' },
    { value: 'good', label: 'ดี', color: 'ok' },
    { value: 'excellent', label: 'ดีเยี่ยม', color: 'ok' }
  ];
  
  const overallLabel = rubricOptions.find(o => o.value === gradeData.overallComment)?.label;
  const scoreLabel = rubricOptions.find(o => o.value === gradeData.score)?.label;
  
  // Before submission section
  const beforeSubmissionSection = h('div', { class: 'card' }, [
    h('h2', {}, gradeData.assignment),
    h('div', { class: 'muted' }, `Submitted by ${gradeData.submittedBy} (${gradeData.team}) on ${gradeData.submittedAt}`),
    h('div', { class: 'spacer' }),
    
    // Attached files section
    h('div', { class: 'field' }, [
      h('label', {}, 'ไฟล์แนบ (Attached Files)'),
      h('div', { class: 'muted' }, 'example.txt'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row', style: 'gap: 8px;' }, [
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' }, '📄'),
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' }, '📄')
      ])
    ])
  ]);
  
  // After submission section (graded results)
  const afterSubmissionSection = h('div', { class: 'card' }, [
    h('div', { class: 'field' }, [
      h('label', {}, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
      h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'ความเห็นรวม (Overall Comment)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
        h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.overallComment)?.color}` }, overallLabel)
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'ให้คะแนน (Give Score)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
        h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.score)?.color}` }, scoreLabel)
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'Comment'),
      h('div', { class: 'muted' }, gradeData.comment)
    ])
  ]);
  
  const content = h('div', { class: 'grid-2-col' }, [beforeSubmissionSection, afterSubmissionSection]);
  layout('Assignment Grade', actions, content);
}

function renderStudentChallengeGrade(id) {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('student-challenges') }, 'Back')];
  
  // Get real submission data
  const submission = state.mock.submissions.find(s => s.id === id);
  if (!submission || !submission.grade) {
    navigate('student-challenges');
    return;
  }
  
  const gradeData = {
    challenge: submission.challenge || submission.assignment,
    submittedBy: submission.by,
    team: submission.team,
    submittedAt: submission.at,
    overallComment: submission.grade.overallComment,
    score: submission.grade.score,
    comment: submission.grade.comment,
    gradedBy: submission.grade.gradedBy,
    gradedAt: submission.grade.gradedAt
  };
  
  // Rubric score options
  const rubricOptions = [
    { value: 'improve', label: 'ปรับปรุง', color: 'danger' },
    { value: 'fair', label: 'พอใช้', color: 'warn' },
    { value: 'good', label: 'ดี', color: 'ok' },
    { value: 'excellent', label: 'ดีเยี่ยม', color: 'ok' }
  ];
  
  const overallLabel = rubricOptions.find(o => o.value === gradeData.overallComment)?.label;
  const scoreLabel = rubricOptions.find(o => o.value === gradeData.score)?.label;
  
  // Before submission section
  const beforeSubmissionSection = h('div', { class: 'card' }, [
    h('h2', {}, gradeData.challenge),
    h('div', { class: 'muted' }, `Submitted by ${gradeData.submittedBy} (${gradeData.team}) on ${gradeData.submittedAt}`),
    h('div', { class: 'spacer' }),
    
    // Attached files section
    h('div', { class: 'field' }, [
      h('label', {}, 'ไฟล์แนบ (Attached Files)'),
      h('div', { class: 'muted' }, submission.files ? submission.files.map(f => f.name).join(', ') : 'No files'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row', style: 'gap: 8px;' }, 
        (submission.files || []).map(file => 
          h('div', { 
            class: 'file-preview', 
            style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' 
          }, '📄')
        )
      )
    ])
  ]);
  
  // After submission section (graded results)
  const afterSubmissionSection = h('div', { class: 'card' }, [
    h('div', { class: 'field' }, [
      h('label', {}, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
      h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'ความเห็นรวม (Overall Comment)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
        h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.overallComment)?.color}` }, overallLabel)
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'ให้คะแนน (Give Score)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
        h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.score)?.color}` }, scoreLabel)
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'field' }, [
      h('label', {}, 'Comment'),
      h('div', { class: 'muted' }, gradeData.comment)
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'muted', style: 'font-size: 12px;' }, `Graded by ${gradeData.gradedBy} on ${gradeData.gradedAt}`)
  ]);
  
  const content = h('div', { class: 'grid-2-col' }, [beforeSubmissionSection, afterSubmissionSection]);
  layout('Challenge Grade', actions, content);
}

function renderStudentCredits() {
  if (!state.user || state.user.role !== 'student') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  const balance = state.user.credits || 100;
  
  // Get real member credits from users data
  const memberCredits = state.mock.users
    .filter(u => u.role === 'student' && u.team === state.user.team)
    .map(u => ({ name: u.name, credits: u.credits || 100, team: u.team }));
  
  // Mock tickets data
  const tickets = [
    { id: 't1', title: '1:1 Mentor Session', cost: 25, when: 'Sep 15, 2pm' },
    { id: 't2', title: 'Design Review', cost: 30, when: 'Sep 16, 11am' },
  ];
  
  const ticketSelect = h('select', { class: 'input' }, tickets.map(t => h('option', { value: t.id }, `${t.title} • ${t.cost} cr`)));
  
  const redeem = () => {
    const selectedTicket = tickets.find(t => t.id === ticketSelect.value);
    if (!selectedTicket) {
      showModal(h('div', {}, [
        h('h2', {}, 'No Ticket Selected'),
        h('p', {}, 'Please select a ticket to redeem.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }
    
    if (balance < selectedTicket.cost) {
      showModal(h('div', {}, [
        h('h2', {}, 'Insufficient Credits'),
        h('p', {}, `You need ${selectedTicket.cost} credits but only have ${balance}.`),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }
    
    showModal(h('div', {}, [
      h('h2', {}, 'Redeem Session'),
      h('p', {}, `Redeem ${selectedTicket.cost} credits for ${selectedTicket.title} at ${selectedTicket.when}?`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: () => {
          // Deduct credits from specific user
          if (!state.user.credits) state.user.credits = 100;
          state.user.credits -= selectedTicket.cost;
          
          // Update user in users array
          const userIndex = state.mock.users.findIndex(u => u.id === state.user.id);
          if (userIndex !== -1) {
            state.mock.users[userIndex].credits = state.user.credits;
          }
          
          // Add to credit history
          const creditHistory = JSON.parse(localStorage.getItem('creditHistory')) || [];
          creditHistory.push({
            id: `ch${Date.now()}`,
            userId: state.user.id,
            userName: state.user.name,
            change: -selectedTicket.cost,
            by: 'System',
            category: 'redeem',
            reason: `Redeemed for ${selectedTicket.title}`,
            timestamp: new Date().toLocaleString()
          });
          localStorage.setItem('creditHistory', JSON.stringify(creditHistory));
          
          // Save users data
          localStorage.setItem('users', JSON.stringify(state.mock.users));
          
          alert('Redeemed successfully!');
          hideModal();
          // Refresh the page to show updated balance
          renderStudentCredits();
        }}, 'Redeem')
      ])
    ]));
  };
  
  // Member credits section
  const memberCreditsList = h('div', { class: 'list' }, memberCredits.map(member =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, member.name),
        h('div', { class: 'meta' }, member.team)
      ]),
      h('span', { class: 'pill ok' }, `${member.credits} credits`)
    ])
  ));
  
  // Credit history (load from localStorage)
  const creditHistory = JSON.parse(localStorage.getItem('creditHistory')) || [];
  const userCreditHistory = creditHistory.filter(h => h.userId === state.user.id);
  
  const openHistoryDetail = (item) => {
    showModal(h('div', {}, [
      h('h2', {}, 'Credit Detail'),
      h('div', { class: 'spacer' }),
      h('div', {}, `${item.change > 0 ? '+' : ''}${item.change} credit${Math.abs(item.change) === 1 ? '' : 's'}`),
      h('div', { class: 'muted' }, `Category: ${item.category}`),
      h('div', { class: 'muted' }, `By: ${item.by}`),
      h('div', { class: 'muted' }, `Time: ${item.timestamp}`),
      h('div', { class: 'spacer' }),
      h('div', {}, item.reason || ''),
      h('div', { class: 'spacer-lg' }),
      h('button', { class: 'btn primary', onclick: hideModal }, 'Close')
    ]));
  };
  
  const historyTable = h('div', { style: 'max-height: 260px; overflow-y: auto; border: 1px solid var(--border); border-radius: 12px;' }, [
    h('table', { class: 'table', style: 'margin: 0;' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, 'History'), h('th', {}, 'By'), h('th', {}, 'Category'), h('th', {}, '')
      ])),
      h('tbody', {}, userCreditHistory.length > 0 ? userCreditHistory.map(it => h('tr', {}, [
        h('td', {}, `${it.change > 0 ? '+' : ''}${it.change} credit${Math.abs(it.change) === 1 ? '' : 's'}`),
        h('td', {}, it.by),
        h('td', {}, it.category),
        h('td', {}, h('button', { class: 'btn', onclick: () => openHistoryDetail(it) }, 'Detail'))
      ])) : [h('tr', {}, [h('td', { colspan: 4, style: 'text-align: center; color: var(--muted);' }, 'No credit history yet')])])
    ])
  ]);
  
  const content = h('div', { class: 'grid-2-col' }, [
    h('div', { class: 'card' }, [
      h('h2', {}, `Balance: ${balance} credits`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [h('label', {}, 'Select Ticket/Session'), ticketSelect]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ok', onclick: redeem }, 'Confirm Redeem')
      ]),
      h('div', { class: 'spacer-lg' }),
      h('h3', {}, 'History'),
      h('div', { class: 'spacer' }),
      historyTable
    ]),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Member Credits Earned'),
      h('div', { class: 'muted' }, 'Credits earned by each team member'),
      h('div', { class: 'spacer' }),
      memberCreditsList
    ])
  ]);
  
  layout('Credits Wallet', actions, content);
}

// --- Mentor Pages ---
function renderMentorAgenda() {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  const all = state.mock.agenda;
  const visible = all.slice(0, 5);
  const list = h('div', { class: 'list' }, visible.map(item =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, `${item.title} • ${item.time}`),
        h('div', { class: 'meta' }, `${item.date} · Room ${item.room}`)
      ]),
      h('span', { class: 'pill info' }, item.status || 'Scheduled')
    ])
  ));
  
  const viewAllBtn = all.length > 5 ? h('div', { class: 'list-actions' }, [
    h('button', { class: 'btn ghost', onclick: () => {
      list.innerHTML = '';
      all.forEach(item => list.appendChild(
        h('div', { class: 'list-item' }, [
          h('div', { class: 'ticket' }, [
            h('div', { class: 'title' }, `${item.title} • ${item.time}`),
            h('div', { class: 'meta' }, `${item.date} · Room ${item.room}`)
          ]),
          h('span', { class: 'pill info' }, item.status || 'Scheduled')
        ])
      ));
    }}, 'View All')
  ]) : null;
  
  const content = h('div', {}, [list, viewAllBtn]);
  layout('Agenda', actions, content);
}

function renderMentorChallenges() {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  const challengesList = h('div', { class: 'list' }, state.mock.challenges.map(c => {
    const submissionCount = state.mock.submissions.filter(s => s.challenge === c.title).length;
    return h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, c.title),
        h('div', { class: 'meta' }, `Due ${c.deadline} · ${c.credits} points · ${submissionCount} submissions`)
      ]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', onclick: () => navigate(`mentor-challenge-detail/${c.id}`) }, 'View Details')
      ])
    ]);
  }));
  
  const content = h('div', {}, [
    h('h2', {}, 'Challenges'),
    h('div', { class: 'muted' }, 'View all available challenges posted by admin'),
    h('div', { class: 'spacer' }),
    challengesList
  ]);
  
  layout('Challenges', actions, content);
}

function renderMentorChallengeDetail(id) {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const challenge = state.mock.challenges.find(c => c.id === id);
  if (!challenge) {
    navigate('mentor-challenges');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('mentor-challenges') }, 'Back')];
  
  // Get mentor's team submissions for this challenge
  const mentorTeam = state.user.team;
  const teamSubmissions = state.mock.submissions.filter(s => s.challenge === challenge.title && s.team === mentorTeam);
  
  const submissionsTable = h('table', { class: 'table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Student'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, '')
    ])),
    h('tbody', {}, teamSubmissions.map(s => h('tr', {}, [
      h('td', {}, s.by), 
      h('td', {}, s.at),
      h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : s.status === 'Graded' ? 'info' : 'warn'}` }, s.status || 'Pending')),
      h('td', {}, h('button', { class: 'btn', onclick: () => navigate(`mentor-submission/${s.id}`) }, 'Grade'))
    ])))
  ]);
  
  const content = h('div', {}, [
    h('h2', {}, challenge.title),
    h('div', { class: 'muted' }, `Due ${challenge.deadline} · ${challenge.credits} points`),
    h('div', { class: 'spacer' }),
    h('div', {}, challenge.description),
    h('div', { class: 'spacer-lg' }),
    h('h3', {}, 'Team Submissions'),
    h('div', { class: 'spacer' }),
    teamSubmissions.length > 0 ? submissionsTable : h('div', { class: 'muted' }, 'No submissions yet')
  ]);
  
  layout('Challenge Detail', actions, content);
}

function renderMentorAssignmentDetail(id) {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const assignment = state.mock.assignments.find(a => a.id === id);
  if (!assignment) {
    navigate('mentor-assignments');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('mentor-assignments') }, 'Back')];
  
  // Get mentor's team submissions for this assignment
  const mentorTeam = state.user.team;
  const teamSubmissions = state.mock.submissions.filter(s => s.assignment === assignment.title && s.team === mentorTeam);
  
  const submissionsTable = h('table', { class: 'table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Student'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, '')
    ])),
    h('tbody', {}, teamSubmissions.map(s => h('tr', {}, [
      h('td', {}, s.by), 
      h('td', {}, s.at),
      h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : s.status === 'Graded' ? 'info' : 'warn'}` }, s.status || 'Pending')),
      h('td', {}, h('button', { class: 'btn', onclick: () => navigate(`mentor-submission/${s.id}`) }, 'Grade'))
    ])))
  ]);
  
  const content = h('div', {}, [
    h('h2', {}, assignment.title),
    h('div', { class: 'muted' }, `Due ${assignment.deadline} · ${assignment.credits} credits`),
    h('div', { class: 'spacer' }),
    h('div', {}, assignment.description),
    h('div', { class: 'spacer-lg' }),
    h('h3', {}, 'Team Submissions'),
    h('div', { class: 'spacer' }),
    teamSubmissions.length > 0 ? submissionsTable : h('div', { class: 'muted' }, 'No submissions yet')
  ]);
  
  layout('Assignment Detail', actions, content);
}

function renderMentorSubmissions() {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  // Get mentor's team from user data
  const mentorTeam = state.user.team;
  
  // Filter submissions to only show mentor's team
  const teamSubmissions = state.mock.submissions.filter(s => s.team === mentorTeam);
  
  // Separate challenge and assignment submissions
  const challengeSubmissions = teamSubmissions.filter(s => s.challenge);
  const assignmentSubmissions = teamSubmissions.filter(s => s.assignment);
  
  // Challenge submissions table
  const challengeTable = h('table', { class: 'table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Type'), h('th', {}, 'Challenge'), h('th', {}, 'By'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, 'Actions')
    ])),
    h('tbody', {}, challengeSubmissions.length > 0 ? challengeSubmissions.map(s => h('tr', {}, [
      h('td', {}, h('span', { class: 'pill info' }, 'Challenge')), 
      h('td', {}, s.challenge || 'N/A'), 
      h('td', {}, s.by || 'N/A'), 
      h('td', {}, s.at || 'N/A'),
      h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : s.status === 'Graded' ? 'info' : 'warn'}` }, s.status || 'Pending')),
      h('td', { style: 'text-align: right; white-space: nowrap;' }, [
        h('button', { class: 'btn primary', onclick: () => showGradingModal(s) }, 'Grade')
      ])
    ])) : [h('tr', {}, [h('td', { colspan: 6, style: 'text-align: center; color: var(--muted);' }, 'No challenge submissions found')])])
  ]);
  
  // Assignment submissions table
  const assignmentTable = h('table', { class: 'table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Type'), h('th', {}, 'Assignment'), h('th', {}, 'By'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, 'Actions')
    ])),
    h('tbody', {}, assignmentSubmissions.length > 0 ? assignmentSubmissions.map(s => h('tr', {}, [
      h('td', {}, h('span', { class: 'pill ok' }, 'Assignment')), 
      h('td', {}, s.assignment || 'N/A'), 
      h('td', {}, s.by || 'N/A'), 
      h('td', {}, s.at || 'N/A'),
      h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : s.status === 'Graded' ? 'info' : 'warn'}` }, s.status || 'Pending')),
      h('td', { style: 'text-align: right; white-space: nowrap;' }, [
        h('button', { class: 'btn primary', onclick: () => showGradingModal(s) }, 'Grade')
      ])
    ])) : [h('tr', {}, [h('td', { colspan: 6, style: 'text-align: center; color: var(--muted);' }, 'No assignment submissions found')])])
  ]);
  
  const content = h('div', {}, [
    h('h2', {}, 'Submissions'),
    h('div', { class: 'muted' }, `Submissions from ${mentorTeam}`),
    h('div', { class: 'spacer' }),
    
    h('h3', {}, 'Challenge Submissions'),
    h('div', { class: 'spacer' }),
    challengeSubmissions.length > 0 ? challengeTable : h('div', { class: 'muted' }, 'No challenge submissions yet'),
    
    h('div', { class: 'spacer-lg' }),
    
    h('h3', {}, 'Assignment Submissions'),
    h('div', { class: 'spacer' }),
    assignmentSubmissions.length > 0 ? assignmentTable : h('div', { class: 'muted' }, 'No assignment submissions yet'),
    
  ]);
  
  layout('Submissions', actions, content);
}

function renderMentorCredits() {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  // Get mentor's team from user data
  const mentorTeam = state.user.team;
  
  // Get team members from users.json
  const teamMembers = state.mock.users.filter(u => u.team === mentorTeam && u.role === 'student');
  
  const userSelect = h('select', { 
    class: 'input',
    id: 'mentor-user-select'
  }, [
    h('option', { value: '' }, 'Select User'),
    ...teamMembers.map(member => 
      h('option', { value: member.id }, member.name)
    )
  ]);
  
  const amountInput = h('input', { class: 'input', placeholder: 'Amount', type: 'number', min: '0', value: '5' });
  const reasonInput = h('textarea', { class: 'input', placeholder: 'Add reason...', rows: 3 });
  const fileInput = h('input', { type: 'file', class: 'input', accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx' });
  
  const give = () => {
    const selectedUser = userSelect.value;
    const amount = parseInt(amountInput.value, 10);
    const reason = reasonInput.value;
    const file = fileInput.files[0];
    
    if (!selectedUser || !amount) {
      showModal(h('div', {}, [
        h('h2', {}, 'Missing Information'),
        h('p', {}, 'Please select a user and enter amount.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }
    
    const user = teamMembers.find(m => m.id === selectedUser);
    const fileName = file ? file.name : 'No file attached';
    
    showModal(h('div', {}, [
      h('h2', {}, 'Give Kudos'),
      h('p', {}, `Give ${amount} credits to ${user?.name} (${mentorTeam})?${reason ? `\n\nReason: ${reason}` : ''}${file ? `\n\nAttachment: ${fileName}` : ''}`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: () => {
          // Update specific student's credit balance
          const studentUser = state.mock.users.find(u => u.id === user.id);
          if (studentUser) {
            if (!studentUser.credits) studentUser.credits = 100; // Initialize if not exists
            studentUser.credits += amount;
          }
          
          // Add to credit history
          const creditHistory = JSON.parse(localStorage.getItem('creditHistory')) || [];
          creditHistory.push({
            id: `ch${Date.now()}`,
            userId: user.id,
            userName: user.name,
            change: amount,
            by: state.user.name,
            category: 'mentor',
            reason: reason,
            attachment: fileName,
            timestamp: new Date().toLocaleString()
          });
          localStorage.setItem('creditHistory', JSON.stringify(creditHistory));
          
          // Save users data
          localStorage.setItem('users', JSON.stringify(state.mock.users));
          
          alert('Kudos sent successfully!');
          hideModal();
          // Reset form
          userSelect.value = '';
          amountInput.value = '5';
          reasonInput.value = '';
          fileInput.value = '';
        }}, 'Give')
      ])
    ]));
  };
  
  // Credit history for team members only
  const creditHistory = JSON.parse(localStorage.getItem('creditHistory')) || [];
  const teamCreditHistory = creditHistory.filter(h => 
    teamMembers.some(member => member.id === h.userId)
  );
  
  const historyTable = h('div', { style: 'max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 12px;' }, [
    h('table', { class: 'table', style: 'margin: 0;' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, 'User'), h('th', {}, 'Change'), h('th', {}, 'By'), h('th', {}, 'Reason'), h('th', {}, 'Time')
      ])),
      h('tbody', {}, teamCreditHistory.length > 0 ? teamCreditHistory.map(it => h('tr', {}, [
        h('td', {}, it.userName),
        h('td', {}, `${it.change > 0 ? '+' : ''}${it.change} credit${Math.abs(it.change) === 1 ? '' : 's'}`),
        h('td', {}, it.by),
        h('td', {}, it.reason || ''),
        h('td', {}, it.timestamp)
      ])) : [h('tr', {}, [h('td', { colspan: 5, style: 'text-align: center; color: var(--muted);' }, 'No credit history yet')])])
    ])
  ]);
  
  const content = h('div', { class: 'grid-2-col' }, [
    h('div', { class: 'card' }, [
      h('h2', {}, 'Give Credits'),
      h('div', { class: 'muted' }, `Give credits to members of ${mentorTeam}`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [h('label', {}, 'Team'), h('input', { class: 'input', value: mentorTeam, disabled: true })]),
      h('div', { class: 'field' }, [h('label', {}, 'User'), userSelect]),
      h('div', { class: 'field' }, [h('label', {}, 'Amount'), amountInput]),
      h('div', { class: 'field' }, [h('label', {}, 'Description'), reasonInput]),
      h('div', { class: 'field' }, [h('label', {}, 'Attachment (Optional)'), fileInput]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ok', onclick: give }, 'Give Credits')
    ]),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Team Credit History'),
      h('div', { class: 'muted' }, `Credit history for ${mentorTeam} members`),
      h('div', { class: 'spacer' }),
      historyTable
    ])
  ]);
  
  layout('Mentor Give Credits', actions, content);
}

function renderMentorAssignments() {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')];
  
  const assignmentsList = h('div', { class: 'list' }, state.mock.assignments.map(a => {
    const submissionCount = state.mock.submissions.filter(s => s.assignment === a.title).length;
    return h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, a.title),
        h('div', { class: 'meta' }, `Due ${a.deadline} · ${a.credits} credits · ${submissionCount} submissions`)
      ]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', onclick: () => navigate(`mentor-assignment-detail/${a.id}`) }, 'View Details')
      ])
    ]);
  }));
  
  const content = h('div', {}, [
    h('h2', {}, 'Assignments'),
    h('div', { class: 'muted' }, 'View all available assignments posted by admin'),
    h('div', { class: 'spacer' }),
    assignmentsList
  ]);
  
  layout('Assignments', actions, content);
}

function renderMentorAssignment(id) {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const assignment = state.mock.assignments.find(a => a.id === id);
  if (!assignment) {
    navigate('mentor-assignments');
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('mentor-assignments') }, 'Back')];
  
  // Mock submitted files for this assignment
  const submittedFiles = [
    { name: 'homework.js', size: '2.3 KB' },
    { name: 'styles.css', size: '1.1 KB' },
    { name: 'index.html', size: '0.8 KB' }
  ];
  
  // Assignment logo placeholder
  const assignmentLogo = h('div', { 
    class: 'assignment-logo',
    style: 'width: 80px; height: 80px; border: 2px solid var(--border); border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); font-size: 24px; color: var(--muted);'
  }, '📝');
  
  // Assignment header section
  const assignmentHeader = h('div', { class: 'row', style: 'align-items: flex-start; gap: 16px;' }, [
    assignmentLogo,
    h('div', { style: 'flex: 1;' }, [
      h('h2', { style: 'margin: 0 0 8px 0;' }, assignment.title),
      h('div', { class: 'muted', style: 'line-height: 1.5;' }, 
        assignment.description || 'Complete this assignment according to the requirements. Submit your work before the due date.')
    ])
  ]);
  
  // Submitted files display
  const filesDisplay = h('div', { class: 'field' }, [
    h('label', {}, 'Submitted Files'),
    ...submittedFiles.map(file => 
      h('div', { 
        class: 'file-display',
        style: 'padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elevated); display: flex; align-items: center; gap: 8px; margin-bottom: 8px;'
      }, [
        h('span', { style: 'font-size: 16px;' }, '📄'),
        h('span', { style: 'flex: 1;' }, file.name),
        h('span', { class: 'muted', style: 'font-size: 12px;' }, file.size)
      ])
    )
  ]);
  
  // Grade button
  const gradeButton = h('button', { 
    class: 'btn primary', 
    onclick: () => {
      // Find first submission for this assignment to grade
      const submission = state.mock.submissions.find(s => s.assignment === assignment.title);
      if (submission) {
        navigate(`mentor-grade-submission/${submission.id}`);
      } else {
        showModal(h('div', {}, [
          h('h2', {}, 'No Submissions'),
          h('p', {}, 'No submissions found for this assignment.'),
          h('div', { class: 'spacer' }),
          h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
        ]));
      }
    }
  }, 'Grade');
  
  const content = h('div', { class: 'card' }, [
    assignmentHeader,
    h('div', { class: 'spacer-lg' }),
    filesDisplay,
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'row right' }, [gradeButton])
  ]);
  
  layout('Assignment Detail', actions, content);
}

function renderMentorSubmission(id) {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const submission = state.mock.submissions.find(s => s.id === id);
  
  if (!submission) {
    showModal(h('div', {}, [
      h('h2', {}, 'Submission Not Found'),
      h('p', {}, 'The requested submission could not be found.'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: () => {
        hideModal();
        navigate('mentor-submissions');
      }}, 'OK')
    ]));
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('mentor-submissions') }, 'Back')];
  
  // Check if already graded
  const isGraded = submission.status === 'Graded' && submission.grade;
  
  // Rubric score options
  const rubricOptions = [
    { value: 'improve', label: 'ปรับปรุง', color: 'danger' },
    { value: 'fair', label: 'พอใช้', color: 'warn' },
    { value: 'good', label: 'ดี', color: 'ok' },
    { value: 'excellent', label: 'ดีเยี่ยม', color: 'ok' }
  ];
  
  // Before submission section (always shown)
  const beforeSubmissionSection = h('div', { class: 'card' }, [
    h('h2', {}, submission.assignment || submission.challenge || 'Submission'),
    h('div', { class: 'muted' }, `Submitted by ${submission.by} (${submission.team}) on ${submission.at}`),
    h('div', { class: 'spacer' }),
    
    // Attached files section
    h('div', { class: 'field' }, [
      h('label', {}, 'ไฟล์แนบ (Attached Files)'),
      h('div', { class: 'muted' }, submission.files ? submission.files.map(f => f.name).join(', ') : 'No files'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row', style: 'gap: 8px;' }, 
        (submission.files || []).map(file => 
          h('div', { 
            class: 'file-preview', 
            style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' 
          }, '📄')
        )
      )
    ])
  ]);
  
  if (!isGraded) {
    // Show grading form
    let selectedOverallComment = '';
    let selectedScore = '';
    
    const overallCommentGroup = h('div', { class: 'field' }, [
      h('label', {}, 'ความเห็นรวม (Overall Comment)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, 
        rubricOptions.map(option => 
          h('button', { 
            class: `btn pill ${option.color}`,
            onclick: (e) => {
              e.target.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
              e.target.classList.add('selected');
              selectedOverallComment = option.value;
            }
          }, option.label)
        )
      )
    ]);
    
    const scoreGroup = h('div', { class: 'field' }, [
      h('label', {}, 'ให้คะแนน (Give Score)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, 
        rubricOptions.map(option => 
          h('button', { 
            class: `btn pill ${option.color}`,
            onclick: (e) => {
              e.target.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
              e.target.classList.add('selected');
              selectedScore = option.value;
            }
          }, option.label)
        )
      )
    ]);
    
    const commentInput = h('textarea', { 
      class: 'input', 
      placeholder: 'Comment...',
      rows: 4
    });
    
    const submitGrade = () => {
      if (!selectedOverallComment || !selectedScore) {
        showModal(h('div', {}, [
          h('h2', {}, 'Missing Information'),
          h('p', {}, 'Please select both overall comment and score.'),
          h('div', { class: 'spacer' }),
          h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
        ]));
        return;
      }
      
      const overallLabel = rubricOptions.find(o => o.value === selectedOverallComment)?.label;
      const scoreLabel = rubricOptions.find(o => o.value === selectedScore)?.label;
      
      showModal(h('div', {}, [
        h('h2', {}, 'Submit Grade'),
        h('p', {}, `Submit grade for ${submission.by}'s submission?\n\nOverall: ${overallLabel}\nScore: ${scoreLabel}${commentInput.value ? `\n\nComment: ${commentInput.value}` : ''}`),
        h('div', { class: 'spacer' }),
        h('div', { class: 'row right' }, [
          h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            // Update submission with grade
            const submissionIndex = state.mock.submissions.findIndex(s => s.id === id);
            if (submissionIndex !== -1) {
              state.mock.submissions[submissionIndex].status = 'Graded';
              state.mock.submissions[submissionIndex].grade = {
                overallComment: selectedOverallComment,
                score: selectedScore,
                comment: commentInput.value,
                gradedBy: state.user.name,
                gradedAt: new Date().toLocaleString()
              };
              
              // Award credits to student
              const studentUser = state.mock.users.find(u => u.name === submission.by);
              if (studentUser) {
                const creditsToAward = selectedScore === 'excellent' ? 10 : selectedScore === 'good' ? 8 : selectedScore === 'fair' ? 5 : 2;
                if (!studentUser.credits) studentUser.credits = 100;
                studentUser.credits += creditsToAward;
                localStorage.setItem('users', JSON.stringify(state.mock.users));
              }
              
              localStorage.setItem('submissions', JSON.stringify(state.mock.submissions));
            }
            
            alert('Grade submitted successfully!');
            hideModal();
            navigate('mentor-submissions');
          }}, 'Submit Grade')
        ])
      ]));
    };
    
    const afterSubmissionSection = h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
        h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
      ]),
      h('div', { class: 'spacer' }),
      overallCommentGroup,
      h('div', { class: 'spacer' }),
      scoreGroup,
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [h('label', {}, 'Comment'), commentInput]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: submitGrade }, 'Submit Grade')
    ]);
    
    const content = h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]);
    layout('Grade Submission', actions, content);
  } else {
    // Show graded results
    const gradeData = submission.grade;
    const overallLabel = rubricOptions.find(o => o.value === gradeData.overallComment)?.label;
    const scoreLabel = rubricOptions.find(o => o.value === gradeData.score)?.label;
    
    const afterSubmissionSection = h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
        h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [
        h('label', {}, 'ความเห็นรวม (Overall Comment)'),
        h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
          h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.overallComment)?.color}` }, overallLabel)
        ])
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [
        h('label', {}, 'ให้คะแนน (Give Score)'),
        h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
          h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.score)?.color}` }, scoreLabel)
        ])
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [
        h('label', {}, 'Comment'),
        h('div', { class: 'muted' }, gradeData.comment)
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'muted', style: 'font-size: 12px;' }, `Graded by ${gradeData.gradedBy} on ${gradeData.gradedAt}`)
    ]);
    
    const content = h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]);
    layout('Grade Submission', actions, content);
  }
}

function renderMentorGradeSubmission(id) {
  if (!state.user || state.user.role !== 'mentor') {
    navigate('login');
    return;
  }
  
  const submission = state.mock.submissions.find(s => s.id === id);
  
  if (!submission) {
    showModal(h('div', {}, [
      h('h2', {}, 'Submission Not Found'),
      h('p', {}, 'The requested submission could not be found.'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: () => {
        hideModal();
        navigate('mentor-assignments');
      }}, 'OK')
    ]));
    return;
  }
  
  const actions = [h('button', { class: 'btn ghost', onclick: () => navigate('mentor-assignments') }, 'Back')];
  
  // Mock grade data (in real app, this would come from database)
  const isGraded = Math.random() > 0.5; // Random for demo
  const gradeData = isGraded ? {
    overallComment: 'good',
    score: 'excellent',
    comment: 'Excellent work! Keep improving.'
  } : null;
  
  // Rubric score options
  const rubricOptions = [
    { value: 'improve', label: 'ปรับปรุง', color: 'danger' },
    { value: 'fair', label: 'พอใช้', color: 'warn' },
    { value: 'good', label: 'ดี', color: 'ok' },
    { value: 'excellent', label: 'ดีเยี่ยม', color: 'ok' }
  ];
  
  // Before submission section (always shown)
  const beforeSubmissionSection = h('div', { class: 'card' }, [
    h('h2', {}, submission.assignment || 'Assignment'),
    h('div', { class: 'muted' }, `Submitted by ${submission.by} (${submission.team}) on ${submission.at}`),
    h('div', { class: 'spacer' }),
    
    // Attached files section
    h('div', { class: 'field' }, [
      h('label', {}, 'ไฟล์แนบ (Attached Files)'),
      h('div', { class: 'muted' }, 'example.txt'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row', style: 'gap: 8px;' }, [
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' }, '📄'),
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);' }, '📄')
      ])
    ])
  ]);
  
  if (!isGraded) {
    // Show grading form
    let selectedOverallComment = '';
    let selectedScore = '';
    
    const overallCommentGroup = h('div', { class: 'field' }, [
      h('label', {}, 'ความเห็นรวม (Overall Comment)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, 
        rubricOptions.map(option => 
          h('button', { 
            class: `btn pill ${option.color}`,
            onclick: (e) => {
              e.target.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
              e.target.classList.add('selected');
              selectedOverallComment = option.value;
            }
          }, option.label)
        )
      )
    ]);
    
    const scoreGroup = h('div', { class: 'field' }, [
      h('label', {}, 'ให้คะแนน (Give Score)'),
      h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, 
        rubricOptions.map(option => 
          h('button', { 
            class: `btn pill ${option.color}`,
            onclick: (e) => {
              e.target.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
              e.target.classList.add('selected');
              selectedScore = option.value;
            }
          }, option.label)
        )
      )
    ]);
    
    const commentInput = h('textarea', { 
      class: 'input', 
      placeholder: 'Comment...',
      rows: 4
    });
    
    const submitGrade = () => {
      if (!selectedOverallComment || !selectedScore) {
        showModal(h('div', {}, [
          h('h2', {}, 'Missing Information'),
          h('p', {}, 'Please select both overall comment and score.'),
          h('div', { class: 'spacer' }),
          h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
        ]));
        return;
      }
      
      const overallLabel = rubricOptions.find(o => o.value === selectedOverallComment)?.label;
      const scoreLabel = rubricOptions.find(o => o.value === selectedScore)?.label;
      
      showModal(h('div', {}, [
        h('h2', {}, 'Submit Grade'),
        h('p', {}, `Submit grade for ${submission.by}'s submission?\n\nOverall: ${overallLabel}\nScore: ${scoreLabel}${commentInput.value ? `\n\nComment: ${commentInput.value}` : ''}`),
        h('div', { class: 'spacer' }),
        h('div', { class: 'row right' }, [
          h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            alert('Grade submitted successfully!');
            hideModal();
            navigate('mentor-assignments');
          }}, 'Submit Grade')
        ])
      ]));
    };
    
    const afterSubmissionSection = h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
        h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
      ]),
      h('div', { class: 'spacer' }),
      overallCommentGroup,
      h('div', { class: 'spacer' }),
      scoreGroup,
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [h('label', {}, 'Comment'), commentInput]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: submitGrade }, 'Submit Grade')
    ]);
    
    const content = h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]);
    layout('Grade Submission', actions, content);
  } else {
    // Show graded results
    const overallLabel = rubricOptions.find(o => o.value === gradeData.overallComment)?.label;
    const scoreLabel = rubricOptions.find(o => o.value === gradeData.score)?.label;
    
    const afterSubmissionSection = h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'นักเรียนต้องกรอกข้อมูลตามเหล่านี้ได้ (Student Requirements)'),
        h('div', { class: 'muted' }, '• Requirement 1\n• Requirement 2\n• Requirement 3')
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [
        h('label', {}, 'ความเห็นรวม (Overall Comment)'),
        h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
          h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.overallComment)?.color}` }, overallLabel)
        ])
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [
        h('label', {}, 'ให้คะแนน (Give Score)'),
        h('div', { class: 'row', style: 'gap: 8px; flex-wrap: wrap;' }, [
          h('span', { class: `pill ${rubricOptions.find(o => o.value === gradeData.score)?.color}` }, scoreLabel)
        ])
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [
        h('label', {}, 'Comment'),
        h('div', { class: 'muted' }, gradeData.comment)
      ])
    ]);
    
    const content = h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]);
    layout('Grade Submission', actions, content);
  }
}

// --- Routes ---
registerRoute('home', renderHomePage);
registerRoute('login', renderLoginPage);
registerRoute('signup', renderSignupPage);
registerRoute('agenda', renderAdminAgenda);
registerRoute('challenges/manage', renderManageChallenges);
registerRoute('challenges/create', () => renderCreatePage('challenges'));
registerRoute('challenges/edit/:id', (params) => renderEditChallenge(params.id));
registerRoute('assignments/manage', renderManageAssignments);
registerRoute('assignments/create', () => renderCreatePage('assignments'));
registerRoute('assignments/edit/:id', (params) => renderEditAssignment(params.id)); // เพิ่ม route สำหรับแก้ไข Assignment
registerRoute('assignments/view/:id', (params) => renderViewAssignment(params.id));
registerRoute('credits/give', renderGiveCredits);

// Student Routes
registerRoute('student-challenges', renderStudentChallenges);
registerRoute('student-challenge/:id', (params) => renderStudentChallenge(params.id));
registerRoute('student-challenge-grade/:id', (params) => renderStudentChallengeGrade(params.id));
registerRoute('student-announcements', renderStudentAnnouncements);
registerRoute('student-announcement/:id', (params) => renderStudentAnnouncement(params.id));
registerRoute('student-assignments', renderStudentAssignments);
registerRoute('student-assignment/:id', (params) => renderStudentAssignment(params.id));
registerRoute('student-assignment-grade/:id', (params) => renderStudentAssignmentGrade(params.id));
registerRoute('student-credits', renderStudentCredits);

// Mentor Routes
registerRoute('mentor-agenda', renderMentorAgenda);
registerRoute('mentor-challenges', renderMentorChallenges);
registerRoute('mentor-challenge-detail/:id', (params) => renderMentorChallengeDetail(params.id));
registerRoute('mentor-submissions', renderMentorSubmissions);
registerRoute('mentor-submission/:id', (params) => renderMentorSubmission(params.id));
registerRoute('mentor-credits', renderMentorCredits);
registerRoute('mentor-assignments', renderMentorAssignments);
registerRoute('mentor-assignment-detail/:id', (params) => renderMentorAssignmentDetail(params.id));
registerRoute('mentor-assignment/:id', (params) => renderMentorAssignment(params.id));
registerRoute('mentor-grade-submission/:id', (params) => renderMentorGradeSubmission(params.id));

// Simple path-to-regex support for :id parameters
function matchRoute(path) {
  for (const [pattern, handler] of Object.entries(routeRegistry)) {
    const partsP = pattern.split('/');
    const partsX = path.split('/');
    if (partsP.length !== partsX.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < partsP.length; i++) {
      const p = partsP[i];
      const x = partsX[i];
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(x);
      else if (p !== x) { ok = false; break; }
    }
    if (ok) return { handler, params };
  }
  return null;
}

// Initial render
window.addEventListener('hashchange', render);
async function render() {
  const path = getPath();
  const match = matchRoute(path);
  if (match && match.handler) {
    match.handler(match.params);
  } else {
    navigate('login'); // Default to login page if no route matches
  }
}

window.onload = async function() {
  await loadData();
  render();
};