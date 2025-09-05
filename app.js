// DRE MVP Prototype - Plain JS SPA with hash routing and mock data

// Router
const routeRegistry = {};
function registerRoute(path, renderFn) { routeRegistry[path] = renderFn; }
function navigate(path) { window.location.hash = `#${path}`; }
function getPath() { return window.location.hash.replace(/^#/, '') || 'login'; }

// App bootstrap
const app = document.getElementById('app');

// Global state (mock)
const state = {
  user: null, // {role: 'admin'|'mentor'|'student', name}
  files: {}, // temporary uploads keyed by token
  credits: {
    admin: { totalGranted: 1200 },
    mentor: { balance: 200 },
    student: { balance: 120 }
  },
  mock: {
    agenda: [
      { id: 'ag1', date: '2025-09-12', title: 'Kickoff', time: '10:00', room: 'Main', status: 'Scheduled' },
      { id: 'ag2', date: '2025-09-13', title: 'Mentor Sync', time: '14:00', room: 'A2', status: 'Scheduled' },
    ],
    submissions: [
      { id: 's1', team: 'Team Alpha', challenge: 'Build Landing', by: 'Alice', at: '2025-09-01 12:00', status: 'Submitted' },
      { id: 's2', team: 'Team Beta', challenge: 'API Auth', by: 'Bob', at: '2025-09-02 15:30', status: 'Pending' },
      { id: 's3', team: 'Team Gamma', challenge: 'Database Design', by: 'Charlie', at: '2025-09-03 09:15', status: 'Submitted' },
      { id: 's4', team: 'Team Alpha', assignment: 'Week 1: HTML/CSS', by: 'David', at: '2025-09-10 14:20', status: 'Submitted' },
      { id: 's5', team: 'Team Beta', assignment: 'Week 1: JS Basics', by: 'Eve', at: '2025-09-11 09:45', status: 'Pending' },
      { id: 's6', team: 'Team Gamma', assignment: 'Week 1: HTML/CSS', by: 'Frank', at: '2025-09-12 16:30', status: 'Submitted' },
    ],
    challenges: [
      { id: 'c1', title: 'Responsive Landing', due: '2025-09-20', points: 50 },
      { id: 'c2', title: 'Auth Microservice', due: '2025-09-22', points: 80 },
    ],
    announcements: [
      { id: 'a1', title: 'Welcome!', body: 'Kickoff is on Friday 10am, bring your laptops.', read: false },
      { id: 'a2', title: 'API Keys', body: 'Check your email for sandbox keys.', read: false },
    ],
    assignments: [
      { id: 'as1', title: 'Week 1: HTML/CSS', due: '2025-09-18', submissions: 12 },
      { id: 'as2', title: 'Week 1: JS Basics', due: '2025-09-19', submissions: 10 },
    ],
    tickets: [
      { id: 't1', title: '1:1 Mentor Session', cost: 25, when: 'Sep 15, 2pm' },
      { id: 't2', title: 'Design Review', cost: 30, when: 'Sep 16, 11am' },
    ],
    teams: [
      { id: 't1', name: 'Team Alpha', members: ['Alice', 'David'] },
      { id: 't2', name: 'Team Beta', members: ['Bob', 'Eve'] },
      { id: 't3', name: 'Team Gamma', members: ['Charlie', 'Frank'] },
    ],
    classroomMembers: [
      { id: 'u1', name: 'Alice', team: 'Team Alpha' },
      { id: 'u2', name: 'Bob', team: 'Team Beta' },
      { id: 'u3', name: 'Charlie', team: 'Team Gamma' },
      { id: 'u4', name: 'David', team: 'Team Alpha' },
      { id: 'u5', name: 'Eve', team: 'Team Beta' },
      { id: 'u6', name: 'Frank', team: 'Team Gamma' },
    ]
  }
};

// Session persistence
const STORAGE_KEY_USER = 'dre_user';
function persistUser(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY_USER);
  } catch (_) {}
}
try {
  const persistedUser = localStorage.getItem(STORAGE_KEY_USER);
  if (persistedUser) state.user = JSON.parse(persistedUser);
} catch (_) {}

// Utilities
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.substring(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  });
  return el;
}

function layout(title, actions, content) {
  const nav = h('div', { class: 'nav' }, [
    h('div', { class: 'brand' }, [
      h('div', { class: 'dot' }, '●'),
      h('div', {}, [
        'DRE MVP ',
        h('small', {}, title ? ` / ${title}` : '')
      ])
    ]),
    h('div', { class: 'nav-actions' }, actions || [])
  ]);
  const container = h('div', { class: 'container' }, [nav, content]);
  app.innerHTML = '';
  app.appendChild(container);
}

function requireAuth(role) {
  if (!state.user) { navigate('login'); return false; }
  if (role && state.user.role !== role) { navigate(`${state.user.role}-dashboard`); return false; }
  return true;
}

// Modals
function showModal(contentNodes) {
  let backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) {
    backdrop = h('div', { id: 'modal-backdrop', class: 'modal-backdrop' });
    document.body.appendChild(backdrop);
  }
  backdrop.innerHTML = '';
  const modal = h('div', { class: 'modal' }, contentNodes);
  backdrop.appendChild(modal);
  backdrop.classList.add('show');
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.classList.remove('show'); };
}

function confirmModal({ title, body, okText = 'Confirm', onOk }) {
  showModal([
    h('h3', {}, title),
    h('div', { class: 'spacer' }),
    h('div', { class: 'muted' }, body),
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'row right' }, [
      h('button', { class: 'btn ghost', onclick: () => document.getElementById('modal-backdrop').classList.remove('show') }, 'Cancel'),
      h('button', { class: 'btn primary', onclick: () => { onOk?.(); document.getElementById('modal-backdrop').classList.remove('show'); } }, okText)
    ])
  ]);
}

// Login
registerRoute('login', () => {
  const roleSelect = h('select', { id: 'role' }, [
    h('option', { value: 'admin' }, 'Admin'),
    h('option', { value: 'mentor' }, 'Mentor'),
    h('option', { value: 'student' }, 'Student'),
  ]);
  const nameInput = h('input', { class: 'input', placeholder: 'Your name', id: 'name' });
  const btn = h('button', { class: 'btn primary', disabled: true, onclick: () => {
    const role = roleSelect.value;
    const name = nameInput.value.trim();
    if (!name) return;
    state.user = { role, name };
    persistUser(state.user);
    navigate(`${role}-dashboard`);
  } }, 'Login');

  const updateValidity = () => {
    const ok = Boolean(nameInput.value.trim());
    if (ok) btn.removeAttribute('disabled'); else btn.setAttribute('disabled', 'true');
  };
  nameInput.addEventListener('input', updateValidity);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!btn.hasAttribute('disabled')) btn.click();
    }
  });

  layout('Login', [], h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('h2', {}, 'Login (Mock)'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [ h('label', {}, 'Role'), roleSelect ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Name'), nameInput ]),
      h('div', { class: 'spacer' }),
      btn
    ])
  ]));
});

// Dashboards
function dashboardLayout(role, tiles) {
  if (!requireAuth(role)) return;
  const actions = [
    h('span', { class: 'pill' }, `${state.user.name} (${state.user.role})`),
    h('button', { class: 'btn ghost', onclick: () => { state.user = null; persistUser(null); navigate('login'); } }, 'Logout')
  ];
  layout('Dashboard', actions, h('div', {}, [
    h('div', { class: 'kpis' }, [
      h('div', { class: 'kpi' }, [h('h3', {}, 'Agenda Items'), h('p', {}, String(state.mock.agenda.length))]),
      h('div', { class: 'kpi' }, [h('h3', {}, 'Submissions'), h('p', {}, String(state.mock.submissions.length))]),
      h('div', { class: 'kpi' }, [h('h3', {}, 'Assignments'), h('p', {}, String(state.mock.assignments.length))]),
      h('div', { class: 'kpi' }, [h('h3', {}, 'Credits'), h('p', {}, String(state.credits[state.user.role]?.balance ?? state.credits.admin.totalGranted))]),
    ]),
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'grid' }, tiles)
  ]));
}

function tile(title, desc, onClick) {
  return h('div', { class: 'card' }, [
    h('h3', {}, title),
    h('div', { class: 'muted' }, desc),
    h('div', { class: 'spacer' }),
    h('button', { class: 'btn', onclick: onClick }, 'Open')
  ]);
}

registerRoute('admin-dashboard', () => {
  dashboardLayout('admin', [
    tile('Agenda', 'View program agenda', () => navigate('admin-agenda')),
    tile('Challenges', 'Create, edit and manage challenges', () => navigate('admin-challenges')),
    tile('Manage Assignments', 'Create and edit assignments', () => navigate('admin-assignments')),
    tile('Give Credits', 'Grant credits to users', () => navigate('admin-credits')),
  ]);
});

registerRoute('mentor-dashboard', () => {
  dashboardLayout('mentor', [
    tile('Agenda', 'View program agenda', () => navigate('mentor-agenda')),
    tile('Challenges', 'View challenges (read-only)', () => navigate('mentor-challenges')),
    tile('View Submissions', 'Review student submissions', () => navigate('mentor-submissions')),
    tile('Give Credits', 'Give mentor-specific credits', () => navigate('mentor-credits')),
    tile('Assignments', 'Classroom-like assignments', () => navigate('mentor-assignments')),
  ]);
});

registerRoute('student-dashboard', () => {
  if (!requireAuth('student')) return;
  const actions = [
    h('span', { class: 'pill' }, `${state.user.name} (student)`),
    h('button', { class: 'btn ghost', onclick: () => { state.user = null; navigate('login'); } }, 'Logout')
  ];
  layout('Dashboard', actions, h('div', { class: 'grid' }, [
    tile('Challenges', 'View and submit challenges', () => navigate('student-challenges')),
    tile('Announcements', 'See updates and details', () => navigate('student-announcements')),
    tile('Assignments', 'Submit classroom assignments', () => navigate('student-assignments')),
    tile('Credits Wallet', 'View and redeem credits', () => navigate('student-credits')),
  ]));
});

// Shared Pages: Agenda, Submissions
function renderAgenda(role) {
  if (!requireAuth(role)) return;
  const actions = [
    h('button', { class: 'btn ghost', onclick: () => navigate(`${role}-dashboard`) }, 'Back'),
  ];
  const all = state.mock.agenda;
  const visible = all.slice(0, 5);
  const list = h('div', { class: 'list' }, visible.map(item => (
    h('div', { class: 'list-item' }, [
      h('div', {}, [
        h('div', { class: 'ticket' }, [
          h('div', { class: 'title' }, `${item.title} • ${item.time}`),
          h('div', { class: 'meta' }, `${item.date} · Room ${item.room}`)
        ])
      ]),
      h('span', { class: `pill info` }, item.status || 'Scheduled')
    ])
  )));
  const viewAllBtn = all.length > 5 ? h('div', { class: 'list-actions' }, [
    h('button', { class: 'btn ghost', onclick: () => {
      list.innerHTML = '';
      all.forEach(item => list.appendChild(
        h('div', { class: 'list-item' }, [
          h('div', {}, [ h('div', { class: 'ticket' }, [ h('div', { class: 'title' }, `${item.title} • ${item.time}`), h('div', { class: 'meta' }, `${item.date} · Room ${item.room}`) ]) ]),
          h('span', { class: 'pill info' }, item.status || 'Scheduled')
        ])
      ));
    } }, 'View All')
  ]) : null;
  layout('Agenda', actions, h('div', {}, [list, viewAllBtn]));
}

registerRoute('admin-agenda', () => renderAgenda('admin'));
registerRoute('mentor-agenda', () => renderAgenda('mentor'));

function renderSubmissions(role) {
  if (!requireAuth(role)) return;
  const actions = [
    h('button', { class: 'btn ghost', onclick: () => navigate(`${role}-dashboard`) }, 'Back'),
  ];
  
  // Team filter for admin
  let teamFilter = null;
  let filteredSubmissions = state.mock.submissions;
  
  if (role === 'admin') {
    teamFilter = h('select', { 
      id: 'team-filter',
      onchange: (e) => {
        const selectedTeam = e.target.value;
        filteredSubmissions = selectedTeam === 'all' ? state.mock.submissions : 
          state.mock.submissions.filter(s => s.team === selectedTeam);
        renderSubmissions(role); // Re-render with filtered data
      }
    }, [
      h('option', { value: 'all' }, 'All Teams'),
      ...state.mock.teams.map(t => h('option', { value: t.name }, t.name))
    ]);
  }
  
  const visible = filteredSubmissions.slice(0, 5);
  const tableBody = h('tbody', {}, visible.map(s => h('tr', {}, [
    h('td', {}, s.team), h('td', {}, s.challenge), h('td', {}, s.by), h('td', {}, s.at),
    h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
    h('td', {}, h('button', { class: 'btn', onclick: () => alert(`Open detail for ${s.id}`) }, 'Open'))
  ])));
  const table = h('table', { class: 'table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Team'), h('th', {}, 'Challenge'), h('th', {}, 'By'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, '')
    ])),
    tableBody
  ]);
  const viewAll = filteredSubmissions.length > 5 ? h('div', { class: 'list-actions' }, [
    h('button', { class: 'btn ghost', onclick: () => {
      tableBody.innerHTML = '';
      filteredSubmissions.forEach(s => tableBody.appendChild(h('tr', {}, [
        h('td', {}, s.team), h('td', {}, s.challenge), h('td', {}, s.by), h('td', {}, s.at),
        h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
        h('td', {}, h('button', { class: 'btn', onclick: () => alert(`Open detail for ${s.id}`) }, 'Open'))
      ])));
    } }, 'View All')
  ]) : null;
  
  const content = [
    ...(teamFilter ? [h('div', { class: 'field' }, [h('label', {}, 'Filter by Team'), teamFilter])] : []),
    table,
    viewAll
  ];
  
  layout('Submissions', actions, h('div', {}, content));
}

registerRoute('admin-submissions', () => renderSubmissions('admin'));
registerRoute('mentor-submissions', () => renderSubmissions('mentor'));

// Admin Challenges Management
registerRoute('admin-challenges', () => {
  if (!requireAuth('admin')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('admin-dashboard') }, 'Back') ];
  
  // Team filter for submissions
  const teamFilter = h('select', { 
    id: 'challenge-team-filter',
    onchange: (e) => {
      const selectedTeam = e.target.value;
      const submissionsTable = document.getElementById('challenge-submissions-table');
      if (submissionsTable) {
        const tbody = submissionsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        const filteredSubmissions = selectedTeam === 'all' ? 
          state.mock.submissions.filter(s => s.challenge) : 
          state.mock.submissions.filter(s => s.challenge && s.team === selectedTeam);
        
        filteredSubmissions.forEach(s => {
          const row = h('tr', {}, [
            h('td', {}, s.team), 
            h('td', {}, s.challenge), 
            h('td', {}, s.by), 
            h('td', {}, s.at),
            h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
            h('td', {}, h('button', { class: 'btn', onclick: () => alert(`Open detail for ${s.id}`) }, 'Open'))
          ]);
          tbody.appendChild(row);
        });
      }
    }
  }, [
    h('option', { value: 'all' }, 'All Teams'),
    ...state.mock.teams.map(t => h('option', { value: t.name }, t.name))
  ]);
  
  const challengesList = h('div', { class: 'list' }, state.mock.challenges.map(c => {
    const submissionCount = state.mock.submissions.filter(s => s.challenge === c.title).length;
    const rename = () => {
      const input = h('input', { class: 'input', value: c.title });
      showModal([
        h('h3', {}, 'Rename Challenge'),
        h('div', { class: 'spacer' }),
        input,
        h('div', { class: 'spacer-lg' }),
        h('div', { class: 'row right' }, [
          h('button', { class: 'btn ghost', onclick: () => document.getElementById('modal-backdrop').classList.remove('show') }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            const oldTitle = c.title;
            const newTitle = input.value?.trim();
            if (!newTitle) return;
            c.title = newTitle;
            // Update mock submission titles to keep counts consistent
            state.mock.submissions.forEach(s => { if (s.challenge === oldTitle) s.challenge = newTitle; });
            document.getElementById('modal-backdrop').classList.remove('show');
            navigate('admin-challenges');
          } }, 'Save')
        ])
      ]);
    };
    return h('div', { class: 'list-item' }, [
      h('div', {}, [
        h('div', { class: 'ticket' }, [
          h('div', { class: 'title' }, [
            c.title,
            h('button', { class: 'btn ghost', style: 'padding:4px 8px; margin-left:8px;', onclick: rename }, '✏️')
          ]),
          h('div', { class: 'meta' }, `Due ${c.due} · ${c.points} points · ${submissionCount} submissions`)
        ])
      ]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', onclick: () => navigate(`admin-challenge-edit/${c.id}`) }, 'View'),
        h('div', { class: 'dropdown', style: 'position: relative;' }, [
          h('button', { class: 'btn', onclick: (e) => {
            const menu = e.target.nextElementSibling;
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
          } }, '⋯'),
          h('div', { 
            class: 'dropdown-menu', 
            style: 'position: absolute; top: 100%; right: 0; background: #0b1120; border: 1px solid #1f2937; border-radius: 8px; padding: 4px; min-width: 120px; display: none; z-index: 1000;' 
          }, [
            h('button', { 
              class: 'btn danger', 
              style: 'width: 100%; text-align: left; margin: 0;',
              onclick: () => {
                confirmModal({
                  title: 'Delete Challenge',
                  body: `Delete "${c.title}"?`,
                  okText: 'Delete',
                  onOk: () => alert('Challenge deleted (mock)')
                });
                e.target.closest('.dropdown-menu').style.display = 'none';
              }
            }, 'Delete')
          ])
        ])
      ])
    ]);
  }));
  
  const addChallengeBtn = h('button', { 
    class: 'btn primary', 
    onclick: () => navigate('admin-challenge-new') 
  }, 'Add New Challenge');
  
  // Challenge submissions table
  const challengeSubmissions = state.mock.submissions.filter(s => s.challenge);
  const submissionsTable = h('table', { class: 'table', id: 'challenge-submissions-table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Team'), h('th', {}, 'Challenge'), h('th', {}, 'By'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, '')
    ])),
    h('tbody', {}, challengeSubmissions.map(s => h('tr', {}, [
      h('td', {}, s.team), h('td', {}, s.challenge), h('td', {}, s.by), h('td', {}, s.at),
      h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
      h('td', {}, h('button', { class: 'btn', onclick: () => alert(`Open detail for ${s.id}`) }, 'Open'))
    ])))
  ]);
  
  layout('Manage Challenges', actions, h('div', {}, [
    h('h3', {}, 'Challenges'),
    h('div', { class: 'list-actions' }, [addChallengeBtn]),
    h('div', { class: 'spacer' }),
    challengesList,
    h('div', { class: 'spacer-lg' }),
    h('h3', {}, 'Challenge Submissions'),
    h('div', { class: 'field' }, [h('label', {}, 'Filter by Team'), teamFilter]),
    h('div', { class: 'spacer' }),
    submissionsTable
  ]));
});

// Admin Challenge Edit/Create
registerRoute('admin-challenge-edit/:id', (params) => {
  if (!requireAuth('admin')) return;
  const challenge = state.mock.challenges.find(c => c.id === params.id);
  const isNew = !challenge;
  
  const titleInput = h('input', { 
    class: 'input', 
    placeholder: 'Challenge title',
    value: challenge?.title || ''
  });
  const dueInput = h('input', { 
    class: 'input', 
    type: 'date',
    value: challenge?.due || ''
  });
  const pointsInput = h('input', { 
    class: 'input', 
    type: 'number',
    placeholder: 'Points',
    value: challenge?.points || ''
  });
  const descriptionInput = h('textarea', { 
    class: 'input', 
    placeholder: 'Challenge description...',
    rows: 4,
    value: challenge?.description || ''
  });
  
  const save = () => {
    if (!titleInput.value || !dueInput.value || !pointsInput.value) {
      alert('Please fill in all required fields');
      return;
    }
    
    confirmModal({
      title: isNew ? 'Create Challenge' : 'Update Challenge',
      body: `${isNew ? 'Create' : 'Update'} challenge "${titleInput.value}"?`,
      okText: isNew ? 'Create' : 'Update',
      onOk: () => {
        alert(`Challenge ${isNew ? 'created' : 'updated'} (mock)`);
        navigate('admin-challenges');
      }
    });
  };
  
  const actions = [ 
    h('button', { class: 'btn ghost', onclick: () => navigate('admin-challenges') }, 'Back') 
  ];
  
  layout(isNew ? 'Create Challenge' : 'Edit Challenge', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [ h('label', {}, 'Title *'), titleInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Due Date *'), dueInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Points *'), pointsInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Description'), descriptionInput ]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: save }, isNew ? 'Create Challenge' : 'Update Challenge')
    ])
  ]));
});

registerRoute('admin-challenge-new', () => {
  // Redirect to edit with no ID to create new
  navigate('admin-challenge-edit/new');
});

// Mentor Challenges (Read-only)
registerRoute('mentor-challenges', () => {
  if (!requireAuth('mentor')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('mentor-dashboard') }, 'Back') ];
  
  const challengesList = h('div', { class: 'list' }, state.mock.challenges.map(c => {
    const submissionCount = state.mock.submissions.filter(s => s.challenge === c.title).length;
    return h('div', { class: 'list-item' }, [
      h('div', {}, [
        h('div', { class: 'ticket' }, [
          h('div', { class: 'title' }, c.title),
          h('div', { class: 'meta' }, `Due ${c.due} · ${c.points} points · ${submissionCount} submissions`)
        ])
      ]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', onclick: () => alert(`View details for ${c.title}`) }, 'View Details')
      ])
    ]);
  }));
  
  layout('Challenges', actions, h('div', {}, [
    h('h3', {}, 'Challenges'),
    h('div', { class: 'muted' }, 'View all available challenges (read-only)'),
    h('div', { class: 'spacer' }),
    challengesList
  ]));
});

// Admin Assignments Management
registerRoute('admin-assignments', () => {
  if (!requireAuth('admin')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('admin-dashboard') }, 'Back') ];
  
  // Team filter for submissions
  const teamFilter = h('select', { 
    id: 'assignment-team-filter',
    onchange: (e) => {
      const selectedTeam = e.target.value;
      const submissionsTable = document.getElementById('assignment-submissions-table');
      if (submissionsTable) {
        const tbody = submissionsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        const filteredSubmissions = selectedTeam === 'all' ? 
          state.mock.submissions.filter(s => s.assignment) : 
          state.mock.submissions.filter(s => s.assignment && s.team === selectedTeam);
        
        filteredSubmissions.forEach(s => {
          const assignment = state.mock.assignments.find(a => a.title === s.assignment);
          const row = h('tr', {}, [
            h('td', {}, s.team), 
            h('td', {}, s.assignment), 
            h('td', {}, s.by), 
            h('td', {}, s.at),
            h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
            h('td', {}, h('button', { class: 'btn', onclick: () => navigate(`admin-assignment/${assignment?.id || 'as1'}`) }, 'Open'))
          ]);
          tbody.appendChild(row);
        });
      }
    }
  }, [
    h('option', { value: 'all' }, 'All Teams'),
    ...state.mock.teams.map(t => h('option', { value: t.name }, t.name))
  ]);
  
  const assignmentsList = h('div', { class: 'list' }, state.mock.assignments.map(a => {
    const submissionCount = state.mock.submissions.filter(s => s.assignment === a.title).length;
    const rename = () => {
      const input = h('input', { class: 'input', value: a.title });
      showModal([
        h('h3', {}, 'Rename Assignment'),
        h('div', { class: 'spacer' }),
        input,
        h('div', { class: 'spacer-lg' }),
        h('div', { class: 'row right' }, [
          h('button', { class: 'btn ghost', onclick: () => document.getElementById('modal-backdrop').classList.remove('show') }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            const oldTitle = a.title;
            const newTitle = input.value?.trim();
            if (!newTitle) return;
            a.title = newTitle;
            // Update mock submission titles to keep counts consistent
            state.mock.submissions.forEach(s => { if (s.assignment === oldTitle) s.assignment = newTitle; });
            document.getElementById('modal-backdrop').classList.remove('show');
            navigate('admin-assignments');
          } }, 'Save')
        ])
      ]);
    };
    return h('div', { class: 'list-item' }, [
      h('div', {}, [
        h('div', { class: 'ticket' }, [
          h('div', { class: 'title' }, [
            a.title,
            h('button', { class: 'btn ghost', style: 'padding:4px 8px; margin-left:8px;', onclick: rename }, '✏️')
          ]),
          h('div', { class: 'meta' }, `Due ${a.due} · ${submissionCount} submissions`)
        ])
      ]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', onclick: () => navigate(`admin-assignment/${a.id}`) }, 'View'),
        h('div', { class: 'dropdown', style: 'position: relative;' }, [
          h('button', { class: 'btn', onclick: (e) => {
            const menu = e.target.nextElementSibling;
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
          } }, '⋯'),
          h('div', { 
            class: 'dropdown-menu', 
            style: 'position: absolute; top: 100%; right: 0; background: #0b1120; border: 1px solid #1f2937; border-radius: 8px; padding: 4px; min-width: 120px; display: none; z-index: 1000;' 
          }, [
            h('button', { 
              class: 'btn danger', 
              style: 'width: 100%; text-align: left; margin: 0;',
              onclick: () => {
                confirmModal({
                  title: 'Delete Assignment',
                  body: `Delete "${a.title}"?`,
                  okText: 'Delete',
                  onOk: () => alert('Assignment deleted (mock)')
                });
                e.target.closest('.dropdown-menu').style.display = 'none';
              }
            }, 'Delete')
          ])
        ])
      ])
    ]);
  }));
  
  const addAssignmentBtn = h('button', { 
    class: 'btn primary', 
    onclick: () => navigate('admin-assignment-new') 
  }, 'Add New Assignment');
  
  // Assignment submissions table
  const assignmentSubmissions = state.mock.submissions.filter(s => s.assignment);
  const submissionsTable = h('table', { class: 'table', id: 'assignment-submissions-table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Team'), h('th', {}, 'Assignment'), h('th', {}, 'By'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, '')
    ])),
    h('tbody', {}, assignmentSubmissions.map(s => {
      const assignment = state.mock.assignments.find(a => a.title === s.assignment);
      return h('tr', {}, [
        h('td', {}, s.team), h('td', {}, s.assignment), h('td', {}, s.by), h('td', {}, s.at),
        h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
        h('td', {}, h('button', { class: 'btn', onclick: () => navigate(`admin-assignment/${assignment?.id || 'as1'}`) }, 'Open'))
      ]);
    }))
  ]);
  
  layout('Manage Assignments', actions, h('div', {}, [
    h('h3', {}, 'Assignments'),
    h('div', { class: 'list-actions' }, [addAssignmentBtn]),
    h('div', { class: 'spacer' }),
    assignmentsList,
    h('div', { class: 'spacer-lg' }),
    h('h3', {}, 'Assignment Submissions'),
    h('div', { class: 'field' }, [h('label', {}, 'Filter by Team'), teamFilter]),
    h('div', { class: 'spacer' }),
    submissionsTable
  ]));
});

// Admin Assignment Edit/Create
registerRoute('admin-assignment-edit/:id', (params) => {
  if (!requireAuth('admin')) return;
  const assignment = state.mock.assignments.find(a => a.id === params.id);
  const isNew = !assignment;
  
  const titleInput = h('input', { 
    class: 'input', 
    placeholder: 'Assignment title',
    value: assignment?.title || ''
  });
  const dueInput = h('input', { 
    class: 'input', 
    type: 'date',
    value: assignment?.due || ''
  });
  const descriptionInput = h('textarea', { 
    class: 'input', 
    placeholder: 'Assignment description...',
    rows: 4,
    value: assignment?.description || ''
  });
  
  const save = () => {
    if (!titleInput.value || !dueInput.value) {
      alert('Please fill in all required fields');
      return;
    }
    
    confirmModal({
      title: isNew ? 'Create Assignment' : 'Update Assignment',
      body: `${isNew ? 'Create' : 'Update'} assignment "${titleInput.value}"?`,
      okText: isNew ? 'Create' : 'Update',
      onOk: () => {
        alert(`Assignment ${isNew ? 'created' : 'updated'} (mock)`);
        navigate('admin-assignments');
      }
    });
  };
  
  const actions = [ 
    h('button', { class: 'btn ghost', onclick: () => navigate('admin-assignments') }, 'Back') 
  ];
  
  layout(isNew ? 'Create Assignment' : 'Edit Assignment', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [ h('label', {}, 'Title *'), titleInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Due Date *'), dueInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Description'), descriptionInput ]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: save }, isNew ? 'Create Assignment' : 'Update Assignment')
    ])
  ]));
});

registerRoute('admin-assignment-new', () => {
  // Redirect to edit with no ID to create new
  navigate('admin-assignment-edit/new');
});

// Admin Assignment Detail (Editable)
registerRoute('admin-assignment/:id', (params) => {
  if (!requireAuth('admin')) return;
  const a = state.mock.assignments.find(x => x.id === params.id);
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('admin-assignments') }, 'Back') ];
  
  // Mock submitted files for this assignment (editable)
  let submittedFiles = [
    { id: 'f1', name: 'homework.js', size: '2.3 KB' },
    { id: 'f2', name: 'styles.css', size: '1.1 KB' },
    { id: 'f3', name: 'index.html', size: '0.8 KB' }
  ];
  
  // Edit mode state
  let isEditMode = false;
  let titleInput, descriptionInput, dueInput;
  
  const toggleEditMode = () => {
    isEditMode = !isEditMode;
    renderAssignmentDetail();
  };
  
  const saveChanges = () => {
    if (titleInput.value && dueInput.value) {
      a.title = titleInput.value;
      a.description = descriptionInput.value;
      a.due = dueInput.value;
      alert('Assignment updated successfully!');
      isEditMode = false;
      renderAssignmentDetail();
    } else {
      alert('Please fill in all required fields');
    }
  };
  
  const addFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      const newFile = {
        id: 'f' + Date.now(),
        name: fileName,
        size: '0 KB'
      };
      submittedFiles.push(newFile);
      renderAssignmentDetail();
    }
  };
  
  const removeFile = (fileId) => {
    submittedFiles = submittedFiles.filter(f => f.id !== fileId);
    renderAssignmentDetail();
  };
  
  const renderAssignmentDetail = () => {
    // Assignment logo placeholder
    const assignmentLogo = h('div', { 
      class: 'assignment-logo',
      style: 'width: 80px; height: 80px; border: 2px solid #1f2937; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #0b1120; font-size: 24px; color: var(--muted);'
    }, '📝');
    
    // Title and Description (editable)
    const titleSection = isEditMode ? 
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { 
          class: 'input', 
          value: a?.title || '',
          onchange: (e) => titleInput = e.target
        })
      ]) :
      h('h2', { style: 'margin: 0 0 8px 0;' }, a?.title || 'Assignment');
    
    const descriptionSection = isEditMode ?
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { 
          class: 'input', 
          rows: 3,
          value: a?.description || '',
          onchange: (e) => descriptionInput = e.target
        })
      ]) :
      h('div', { class: 'muted', style: 'line-height: 1.5;' }, 
        a?.description || 'Complete this assignment according to the requirements. Submit your work before the due date.');
    
    // Due date (editable)
    const dueSection = isEditMode ?
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { 
          class: 'input', 
          type: 'date',
          value: a?.due || '',
          onchange: (e) => dueInput = e.target
        })
      ]) :
      h('div', { class: 'muted', style: 'margin-bottom: 16px;' }, `Due: ${a?.due || 'Not set'}`);
    
    // Assignment header section
    const assignmentHeader = h('div', { class: 'row', style: 'align-items: flex-start; gap: 16px;' }, [
      assignmentLogo,
      h('div', { style: 'flex: 1;' }, [
        titleSection,
        descriptionSection,
        dueSection
      ])
    ]);
    
    // Files section (editable)
    const filesDisplay = h('div', { class: 'field' }, [
      h('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
        h('label', {}, 'Assignment Files'),
        isEditMode ? h('button', { class: 'btn ghost', onclick: addFile }, '+ Add File') : null
      ]),
      ...submittedFiles.map(file => 
        h('div', { 
          class: 'file-display',
          style: 'padding: 12px; border: 1px solid #1f2937; border-radius: 8px; background: #0b1120; display: flex; align-items: center; gap: 8px; margin-bottom: 8px;'
        }, [
          h('span', { style: 'font-size: 16px;' }, '📄'),
          h('span', { style: 'flex: 1;' }, file.name),
          h('span', { class: 'muted', style: 'font-size: 12px;' }, file.size),
          isEditMode ? h('button', { 
            class: 'btn danger', 
            style: 'padding: 4px 8px; margin-left: 8px;',
            onclick: () => removeFile(file.id)
          }, '×') : null
        ])
      )
    ]);
    
    // Action buttons
    const actionButtons = isEditMode ? 
      h('div', { class: 'row right', style: 'gap: 8px;' }, [
        h('button', { class: 'btn ghost', onclick: () => { isEditMode = false; renderAssignmentDetail(); } }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: saveChanges }, 'Save Changes')
      ]) :
      h('div', { class: 'row right', style: 'gap: 8px;' }, [
        h('button', { class: 'btn', onclick: toggleEditMode }, 'Edit'),
        h('button', { class: 'btn primary', onclick: () => {
          const submission = state.mock.submissions.find(s => s.assignment === a?.title);
          if (submission) {
            navigate(`mentor-grade-submission/${submission.id}`);
          } else {
            alert('No submissions found for this assignment');
          }
        }}, 'Grade')
      ]);
    
    // Render the layout
    const content = h('div', { class: 'grid' }, [
      h('div', { class: 'card' }, [
        assignmentHeader,
        h('div', { class: 'spacer-lg' }),
        filesDisplay,
        h('div', { class: 'spacer-lg' }),
        actionButtons
      ])
    ]);
    
    layout('Assignment Detail', actions, content);
  };
  
  // Initialize
  renderAssignmentDetail();
});

// Mentor Grade Submission
registerRoute('mentor-grade-submission/:id', (params) => {
  if (!requireAuth('mentor')) return;
  const submission = state.mock.submissions.find(s => s.id === params.id);
  
  if (!submission) {
    alert('Submission not found');
    navigate('mentor-assignments');
    return;
  }
  
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('mentor-assignments') }, 'Back') ];
  
  // Mock grade data (in real app, this would come from database)
  const isGraded = Math.random() > 0.5; // Random for demo
  const gradeData = isGraded ? {
    overallComment: 'fair',
    score: 'good',
    comment: 'Good work! Keep improving.'
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
    h('h3', {}, submission.assignment || 'Assignment'),
    h('div', { class: 'muted' }, `Submitted by ${submission.by} (${submission.team}) on ${submission.at}`),
    h('div', { class: 'spacer' }),
    
    // Attached files section
    h('div', { class: 'field' }, [
      h('label', {}, 'ไฟล์แนบ (Attached Files)'),
      h('div', { class: 'muted' }, 'example.txt'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row', style: 'gap: 8px;' }, [
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid #1f2937; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #0b1120;' }, '📄'),
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid #1f2937; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #0b1120;' }, '📄')
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
        alert('Please select both overall comment and score');
        return;
      }
      
      const overallLabel = rubricOptions.find(o => o.value === selectedOverallComment)?.label;
      const scoreLabel = rubricOptions.find(o => o.value === selectedScore)?.label;
      
      confirmModal({
        title: 'Submit Grade',
        body: `Submit grade for ${submission.by}'s submission?\n\nOverall: ${overallLabel}\nScore: ${scoreLabel}${commentInput.value ? `\n\nComment: ${commentInput.value}` : ''}`,
        okText: 'Submit Grade',
        onOk: () => {
          alert('Grade submitted successfully (mock)');
          navigate('mentor-assignments');
        }
      });
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
    
    layout('Grade Submission', actions, h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]));
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
    
    layout('Grade Submission', actions, h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]));
  }
});

// Give Credits (Admin)
registerRoute('admin-credits', () => {
  if (!requireAuth('admin')) return;
  
  const teamSelect = h('select', { 
    id: 'admin-team-select',
    onchange: (e) => {
      const selectedTeam = e.target.value;
      const userSelect = document.getElementById('admin-user-select');
      userSelect.innerHTML = '';
      userSelect.appendChild(h('option', { value: '' }, 'Select User'));
      
      if (selectedTeam) {
        const teamMembers = state.mock.classroomMembers.filter(m => m.team === selectedTeam);
        teamMembers.forEach(member => {
          userSelect.appendChild(h('option', { value: member.id }, member.name));
        });
      }
    }
  }, [
    h('option', { value: '' }, 'Select Team'),
    ...state.mock.teams.map(t => h('option', { value: t.name }, t.name))
  ]);
  
  const userSelect = h('select', { 
    id: 'admin-user-select',
    disabled: true
  }, [
    h('option', { value: '' }, 'Select User')
  ]);
  
  // Category dropdown controls auto-amount behavior
  const CATEGORY_TO_AMOUNT = {
    share: 2,
    ask: 1,
    answer: 1
  };
  const categorySelect = h('select', {
    id: 'admin-category-select',
    onchange: (e) => {
      const key = e.target.value;
      if (CATEGORY_TO_AMOUNT[key] != null) {
        amountInput.value = String(CATEGORY_TO_AMOUNT[key]);
        amountInput.setAttribute('disabled', 'true');
      } else {
        amountInput.removeAttribute('disabled');
        amountInput.value = '';
      }
    }
  }, [
    h('option', { value: '' }, 'Select Category'),
    h('option', { value: 'share' }, 'Share (+2)'),
    h('option', { value: 'ask' }, 'Ask (+1)'),
    h('option', { value: 'answer' }, 'Answer (+1)'),
    h('option', { value: 'additional' }, 'Additional (custom)')
  ]);

  const amountInput = h('input', { class: 'input', placeholder: 'Amount', type: 'number', min: '0' });
  const reasonInput = h('textarea', { class: 'input', placeholder: 'Add reason...', rows: 3 });
  
  // Optional file evidence upload
  const fileNamePreview = h('div', { class: 'muted' }, 'No file selected');
  const evidenceInput = h('input', { 
    type: 'file', 
    id: 'admin-credit-evidence', 
    onchange: (e) => {
      const f = e.target.files?.[0];
      fileNamePreview.textContent = f ? `${f.name} (${Math.ceil(f.size/1024)} KB)` : 'No file selected';
    }
  });
  
  const grant = () => {
    const selectedTeam = teamSelect.value;
    const selectedUser = userSelect.value;
    const selectedCategory = categorySelect.value;
    const amount = amountInput.value;
    const reason = reasonInput.value;
    const evidenceFile = evidenceInput.files?.[0];
    
    if (!selectedTeam || !selectedUser || !selectedCategory || !amount) {
      alert('Please select team, user, category, and enter amount');
      return;
    }
    
    const user = state.mock.classroomMembers.find(m => m.id === selectedUser);
    confirmModal({
      title: 'Grant Credits',
      body: `Grant ${amount} credits to ${user?.name} (${selectedTeam})?\nCategory: ${selectedCategory}${reason ? `\n\nReason: ${reason}` : ''}${evidenceFile ? `\n\nAttachment: ${evidenceFile.name}` : ''}`,
      okText: 'Grant',
      onOk: () => alert('Credits granted (mock)')
    });
  };
  
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('admin-dashboard') }, 'Back') ];
  layout('Give Credits', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [ h('label', {}, 'Team'), teamSelect ]),
      h('div', { class: 'field' }, [ h('label', {}, 'User'), userSelect ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Category'), categorySelect ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Amount'), amountInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Attachment (optional)'), evidenceInput, fileNamePreview ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Description'), reasonInput ]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ok', onclick: grant }, 'Grant Credits')
    ])
  ]));
});

// Give Credits (Mentor-specific)
registerRoute('mentor-credits', () => {
  if (!requireAuth('mentor')) return;
  
  // Mock mentor team assignment (in real app, this would come from user data)
  const mentorTeam = 'Team Alpha'; // Mock: mentor is assigned to Team Alpha
  
  const teamSelect = h('select', { 
    id: 'mentor-team-select',
    disabled: true,
    value: mentorTeam
  }, [
    h('option', { value: mentorTeam }, mentorTeam)
  ]);
  
  const userSelect = h('select', { 
    id: 'mentor-user-select'
  }, [
    h('option', { value: '' }, 'Select User'),
    ...state.mock.classroomMembers.filter(m => m.team === mentorTeam).map(member => 
      h('option', { value: member.id }, member.name)
    )
  ]);
  
  const amountInput = h('input', { class: 'input', placeholder: 'Amount', type: 'number', min: '0', value: '5' });
  const reasonInput = h('textarea', { class: 'input', placeholder: 'Add reason...', rows: 3 });
  
  const give = () => {
    const selectedTeam = teamSelect.value;
    const selectedUser = userSelect.value;
    const amount = amountInput.value;
    const reason = reasonInput.value;
    
    if (!selectedTeam || !selectedUser || !amount) {
      alert('Please select team, user, and enter amount');
      return;
    }
    
    const user = state.mock.classroomMembers.find(m => m.id === selectedUser);
    confirmModal({
      title: 'Give Kudos',
      body: `Give ${amount} credits to ${user?.name} (${selectedTeam})?${reason ? `\n\nReason: ${reason}` : ''}`,
      okText: 'Give',
      onOk: () => alert('Kudos sent (mock)')
    });
  };
  
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('mentor-dashboard') }, 'Back') ];
  layout('Mentor Give Credits', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('div', { class: 'field' }, [ h('label', {}, 'Team'), teamSelect ]),
      h('div', { class: 'field' }, [ h('label', {}, 'User'), userSelect ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Amount'), amountInput ]),
      h('div', { class: 'field' }, [ h('label', {}, 'Description'), reasonInput ]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ok', onclick: give }, 'Give Credits')
    ])
  ]));
});

// Mentor Assignments List
registerRoute('mentor-assignments', () => {
  if (!requireAuth('mentor')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('mentor-dashboard') }, 'Back') ];
  
  // Mock mentor team assignment (in real app, this would come from user data)
  const mentorTeam = 'Team Alpha'; // Mock: mentor is assigned to Team Alpha
  
  // Assignment submissions table (filtered to mentor's team only)
  const assignmentSubmissions = state.mock.submissions.filter(s => s.assignment && s.team === mentorTeam);
  const submissionsTable = h('table', { class: 'table', id: 'mentor-assignment-submissions-table' }, [
    h('thead', {}, h('tr', {}, [
      h('th', {}, 'Assignment'), h('th', {}, 'By'), h('th', {}, 'Submitted At'), h('th', {}, 'Status'), h('th', {}, '')
    ])),
    h('tbody', {}, assignmentSubmissions.map(s => {
      // Find assignment by title to get the ID
      const assignment = state.mock.assignments.find(a => a.title === s.assignment);
      return h('tr', {}, [
        h('td', {}, s.assignment), h('td', {}, s.by), h('td', {}, s.at),
        h('td', {}, h('span', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status || 'Pending')),
        h('td', {}, h('button', { class: 'btn', onclick: () => navigate(`mentor-assignment/${assignment?.id || 'as1'}`) }, 'Open'))
      ]);
    }))
  ]);
  
  layout('Assignments', actions, h('div', {}, [
    h('h3', {}, 'Assignment Submissions'),
    h('div', { class: 'spacer' }),
    submissionsTable
  ]));
});

// Mentor Assignment Detail + Evaluate flow
registerRoute('mentor-assignment/:id', (params) => {
  if (!requireAuth('mentor')) return;
  const a = state.mock.assignments.find(x => x.id === params.id);
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('mentor-assignments') }, 'Back') ];
  
  // Mock submitted files for this assignment
  const submittedFiles = [
    { name: 'homework.js', size: '2.3 KB' },
    { name: 'styles.css', size: '1.1 KB' },
    { name: 'index.html', size: '0.8 KB' }
  ];
  
  // Assignment logo placeholder
  const assignmentLogo = h('div', { 
    class: 'assignment-logo',
    style: 'width: 80px; height: 80px; border: 2px solid #1f2937; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #0b1120; font-size: 24px; color: var(--muted);'
  }, '📝');
  
  // Assignment header section
  const assignmentHeader = h('div', { class: 'row', style: 'align-items: flex-start; gap: 16px;' }, [
    assignmentLogo,
    h('div', { style: 'flex: 1;' }, [
      h('h2', { style: 'margin: 0 0 8px 0;' }, a?.title || 'Assignment'),
      h('div', { class: 'muted', style: 'line-height: 1.5;' }, 
        a?.description || 'Complete this assignment according to the requirements. Submit your work before the due date.')
    ])
  ]);
  
  // Submitted files display
  const filesDisplay = h('div', { class: 'field' }, [
    h('label', {}, 'Submitted Files'),
    ...submittedFiles.map(file => 
      h('div', { 
        class: 'file-display',
        style: 'padding: 12px; border: 1px solid #1f2937; border-radius: 8px; background: #0b1120; display: flex; align-items: center; gap: 8px; margin-bottom: 8px;'
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
      const submission = state.mock.submissions.find(s => s.assignment === a?.title);
      if (submission) {
        navigate(`mentor-grade-submission/${submission.id}`);
      } else {
        alert('No submissions found for this assignment');
      }
    }
  }, 'Grade');
  
  layout('Assignment Detail', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      assignmentHeader,
      h('div', { class: 'spacer-lg' }),
      filesDisplay,
      h('div', { class: 'spacer-lg' }),
      h('div', { class: 'row right' }, [gradeButton])
    ])
  ]));
});

// Student: Challenges
registerRoute('student-challenges', () => {
  if (!requireAuth('student')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-dashboard') }, 'Back') ];
  layout('Challenges', actions, h('div', { class: 'list' }, state.mock.challenges.map(c => (
    h('div', { class: 'list-item' }, [
      h('div', {}, [ h('div', { class: 'ticket' }, [ h('div', { class: 'title' }, c.title), h('div', { class: 'meta' }, `Due ${c.due} · ${c.points} pts`) ]) ]),
      h('button', { class: 'btn', onclick: () => navigate(`student-challenge/${c.id}`) }, 'Open')
    ])
  ))));
});

registerRoute('student-challenge/:id', (params) => {
  if (!requireAuth('student')) return;
  const c = state.mock.challenges.find(x => x.id === params.id);
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-challenges') }, 'Back') ];
  const filesInput = h('input', { type: 'file', multiple: true });
  const submit = () => confirmModal({
    title: 'Confirm Submission',
    body: `Submit ${filesInput.files.length} file(s) for "${c?.title}"?`,
    okText: 'Submit',
    onOk: () => alert('Submission sent (mock)')
  });
  layout('Challenge Detail', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('h3', {}, c?.title || 'Challenge'),
      h('div', { class: 'muted' }, `Due ${c?.due}`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [ h('label', {}, 'Attach File(s)'), filesInput ]),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: submit }, 'Submit')
    ])
  ]));
});

// Student: Announcements
registerRoute('student-announcements', () => {
  if (!requireAuth('student')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-dashboard') }, 'Back') ];
  const all = state.mock.announcements;
  const visible = all.slice(0, 5);
  const list = h('div', { class: 'list' }, visible.map(a => (
    h('div', { class: 'list-item' }, [
      h('div', {}, [ h('div', { class: 'ticket' }, [ h('div', { class: 'title' }, a.title), h('div', { class: 'meta' }, 'Tap for details') ]) ]),
      h('div', { class: 'row' }, [
        h('span', { class: `pill ${a.read ? 'info' : 'warn'}` }, a.read ? 'Read' : 'Unread'),
        h('button', { class: 'btn', onclick: () => navigate(`student-announcement/${a.id}`) }, 'Open')
      ])
    ])
  )));
  const viewAll = all.length > 5 ? h('div', { class: 'list-actions' }, [
    h('button', { class: 'btn ghost', onclick: () => {
      list.innerHTML = '';
      all.forEach(a => list.appendChild(
        h('div', { class: 'list-item' }, [
          h('div', {}, [ h('div', { class: 'ticket' }, [ h('div', { class: 'title' }, a.title), h('div', { class: 'meta' }, 'Tap for details') ]) ]),
          h('div', { class: 'row' }, [
            h('span', { class: `pill ${a.read ? 'info' : 'warn'}` }, a.read ? 'Read' : 'Unread'),
            h('button', { class: 'btn', onclick: () => navigate(`student-announcement/${a.id}`) }, 'Open')
          ])
        ])
      ));
    } }, 'View All')
  ]) : null;
  layout('Announcements', actions, h('div', {}, [list, viewAll]));
});

registerRoute('student-announcement/:id', (params) => {
  if (!requireAuth('student')) return;
  const a = state.mock.announcements.find(x => x.id === params.id);
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-announcements') }, 'Back') ];
  const markRead = () => { a.read = true; alert('Marked as read'); };
  layout('Announcement Detail', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('h3', {}, a?.title || 'Announcement'),
      h('div', { class: 'spacer' }),
      h('div', {}, a?.body || ''),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('span', { class: `pill ${a.read ? 'info' : 'warn'}` }, a.read ? 'Read' : 'Unread'),
        h('button', { class: 'btn primary', onclick: markRead }, 'Mark as Read')
      ])
    ])
  ]));
});

// Student: Assignments submit
registerRoute('student-assignments', () => {
  if (!requireAuth('student')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-dashboard') }, 'Back') ];
  
  // Mock student submissions with grades
  const studentSubmissions = [
    { id: 's1', assignment: 'Week 1: HTML/CSS', submitted: true, graded: true, grade: { overall: 'good', score: 'excellent', comment: 'Excellent work!' } },
    { id: 's2', assignment: 'Week 1: JS Basics', submitted: true, graded: false, grade: null },
    { id: 's3', assignment: 'Week 2: React', submitted: false, graded: false, grade: null }
  ];
  
  const assignmentsList = h('div', { class: 'list' }, state.mock.assignments.map(a => {
    const submission = studentSubmissions.find(s => s.assignment === a.title);
    const status = submission?.submitted ? (submission?.graded ? 'Graded' : 'Submitted') : 'Not Submitted';
    const statusColor = submission?.graded ? 'ok' : submission?.submitted ? 'warn' : 'danger';
    
    return h('div', { class: 'list-item' }, [
      h('div', {}, [ 
        h('div', { class: 'ticket' }, [ 
          h('div', { class: 'title' }, a.title), 
          h('div', { class: 'meta' }, `Due ${a.due}`) 
        ]) 
      ]),
      h('div', { class: 'row' }, [
        h('span', { class: `pill ${statusColor}` }, status),
        h('button', { 
          class: 'btn', 
          onclick: () => {
            if (submission?.graded) {
              navigate(`student-assignment-grade/${submission.id}`);
            } else {
              navigate(`student-assignment/${a.id}`);
            }
          }
        }, submission?.graded ? 'View Grade' : 'Open')
      ])
    ]);
  }));
  
  layout('Assignments', actions, h('div', {}, [assignmentsList]));
});

registerRoute('student-assignment/:id', (params) => {
  if (!requireAuth('student')) return;
  const a = state.mock.assignments.find(x => x.id === params.id);
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-assignments') }, 'Back') ];
  
  // Assignment logo placeholder
  const assignmentLogo = h('div', { 
    class: 'assignment-logo',
    style: 'width: 80px; height: 80px; border: 2px solid #1f2937; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #0b1120; font-size: 24px; color: var(--muted);'
  }, '📝');
  
  // Assignment header section
  const assignmentHeader = h('div', { class: 'row', style: 'align-items: flex-start; gap: 16px;' }, [
    assignmentLogo,
    h('div', { style: 'flex: 1;' }, [
      h('h2', { style: 'margin: 0 0 8px 0;' }, a?.title || 'Assignment'),
      h('div', { class: 'muted', style: 'line-height: 1.5;' }, 
        a?.description || 'Complete this assignment according to the requirements. Submit your work before the due date.')
    ])
  ]);
  
  // File display section
  const fileDisplay = h('div', { class: 'field' }, [
    h('label', {}, 'File'),
    h('div', { 
      class: 'file-display',
      style: 'padding: 12px; border: 1px solid #1f2937; border-radius: 8px; background: #0b1120; display: flex; align-items: center; gap: 8px;'
    }, [
      h('span', { style: 'font-size: 16px;' }, '📄'),
      h('span', {}, 'Example.txt')
    ])
  ]);
  
  // Upload area
  const uploadArea = h('div', { 
    class: 'upload-area',
    style: 'border: 2px dashed #1f2937; border-radius: 12px; padding: 40px; text-align: center; background: #0b1120; cursor: pointer; transition: all 0.2s ease;',
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
        uploadArea.style.background = '#0b1120';
      }
    }
  });
  
  const submit = () => {
    const files = document.getElementById('file-upload').files;
    confirmModal({
      title: 'Submit Assignment',
      body: `Submit ${files.length} file(s) for "${a?.title}"?`,
      okText: 'Submit',
      onOk: () => alert('Assignment submitted (mock)')
    });
  };
  
  layout('Assignment Detail', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      assignmentHeader,
      h('div', { class: 'spacer-lg' }),
      fileDisplay,
      h('div', { class: 'spacer' }),
      uploadArea,
      filesInput,
      h('div', { class: 'spacer-lg' }),
      h('button', { class: 'btn primary', onclick: submit }, 'Submit')
    ])
  ]));
});

// Student: View Assignment Grade
registerRoute('student-assignment-grade/:id', (params) => {
  if (!requireAuth('student')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-assignments') }, 'Back') ];
  
  // Mock grade data
  const gradeData = {
    assignment: 'Week 1: HTML/CSS',
    submittedBy: 'You',
    team: 'Team Alpha',
    submittedAt: '2025-09-10 14:20',
    overallComment: 'good',
    score: 'excellent',
    comment: 'Excellent work! Your code is clean and well-structured. Keep up the great work!'
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
    h('h3', {}, gradeData.assignment),
    h('div', { class: 'muted' }, `Submitted by ${gradeData.submittedBy} (${gradeData.team}) on ${gradeData.submittedAt}`),
    h('div', { class: 'spacer' }),
    
    // Attached files section
    h('div', { class: 'field' }, [
      h('label', {}, 'ไฟล์แนบ (Attached Files)'),
      h('div', { class: 'muted' }, 'example.txt'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row', style: 'gap: 8px;' }, [
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid #1f2937; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #0b1120;' }, '📄'),
        h('div', { class: 'file-preview', style: 'width: 60px; height: 60px; border: 1px solid #1f2937; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #0b1120;' }, '📄')
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
  
  layout('Assignment Grade', actions, h('div', { class: 'grid' }, [beforeSubmissionSection, afterSubmissionSection]));
});

// Student: Credits wallet
registerRoute('student-credits', () => {
  if (!requireAuth('student')) return;
  const actions = [ h('button', { class: 'btn ghost', onclick: () => navigate('student-dashboard') }, 'Back') ];
  const balance = state.credits.student.balance;
  
  // Mock data for member credits
  const memberCredits = [
    { name: 'Alice', credits: 45, team: 'Team Alpha' },
    { name: 'Bob', credits: 32, team: 'Team Beta' },
    { name: 'Charlie', credits: 58, team: 'Team Gamma' },
    { name: 'David', credits: 28, team: 'Team Alpha' },
    { name: 'Eve', credits: 41, team: 'Team Beta' },
    { name: 'Frank', credits: 35, team: 'Team Gamma' }
  ];
  
  const ticketSelect = h('select', {}, state.mock.tickets.map(t => h('option', { value: t.id }, `${t.title} • ${t.cost} cr`)));
  
  const redeem = () => {
    const t = state.mock.tickets.find(x => x.id === ticketSelect.value);
    confirmModal({
      title: 'Redeem Session',
      body: `Redeem ${t.cost} credits for ${t.title} at ${t.when}?`,
      okText: 'Redeem',
      onOk: () => alert('Redeemed (mock)')
    });
  };
  
  // Member credits section
  const memberCreditsList = h('div', { class: 'list' }, memberCredits.map(member => (
    h('div', { class: 'list-item' }, [
      h('div', {}, [
        h('div', { class: 'ticket' }, [
          h('div', { class: 'title' }, member.name),
          h('div', { class: 'meta' }, member.team)
        ])
      ]),
      h('span', { class: 'pill ok' }, `${member.credits} credits`)
    ])
  )));
  
  // Credit history (mock)
  const creditHistory = [
    { id: 'h1', change: +5, by: 'Member 1', category: 'Share', detail: 'Shared a helpful resource' },
    { id: 'h2', change: -1, by: '-', category: 'Challenge', detail: 'Redeemed for challenge hint' },
    { id: 'h3', change: +2, by: 'Member 3', category: 'Ask', detail: 'Asked a great question' },
    { id: 'h4', change: +1, by: 'Mentor', category: 'Answer', detail: 'Answered in forum' },
    { id: 'h5', change: -25, by: '-', category: 'Redeem', detail: '1:1 Mentor Session' }
  ];
  const openHistoryDetail = (item) => {
    showModal([
      h('h3', {}, 'Credit Detail'),
      h('div', { class: 'spacer' }),
      h('div', {}, `${item.change > 0 ? '+' : ''}${item.change} credit${Math.abs(item.change) === 1 ? '' : 's'}`),
      h('div', { class: 'muted' }, `Category: ${item.category}`),
      h('div', { class: 'muted' }, `By: ${item.by}`),
      h('div', { class: 'spacer' }),
      h('div', {}, item.detail || ''),
      h('div', { class: 'spacer-lg' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => document.getElementById('modal-backdrop').classList.remove('show') }, 'Close')
      ])
    ]);
  };
  const historyTable = h('div', { style: 'max-height: 260px; overflow-y: auto; border: 1px solid #1f2937; border-radius: 12px;' }, [
    h('table', { class: 'table', style: 'margin: 0;' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, 'History'), h('th', {}, 'By'), h('th', {}, 'Category'), h('th', {}, '')
      ])),
      h('tbody', {}, creditHistory.map(it => h('tr', {}, [
        h('td', {}, `${it.change > 0 ? '+' : ''}${it.change} credit${Math.abs(it.change) === 1 ? '' : 's'}`),
        h('td', {}, it.by),
        h('td', {}, it.category),
        h('td', {}, h('button', { class: 'btn', onclick: () => openHistoryDetail(it) }, 'Detail'))
      ])))
    ])
  ]);
  
  layout('Credits Wallet', actions, h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('h3', {}, `Balance: ${balance} credits`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'field' }, [ h('label', {}, 'Select Ticket/Session'), ticketSelect ]),
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
      h('h3', {}, 'Member Credits Earned'),
      h('div', { class: 'muted' }, 'Credits earned by each team member'),
      h('div', { class: 'spacer' }),
      memberCreditsList
    ])
  ]));
});

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

function render() {
  const path = getPath();
  const m = matchRoute(path);
  if (m) return m.handler(m.params);
  // default unknown route -> dashboard or login
  if (state.user) navigate(`${state.user.role}-dashboard`); else navigate('login');
}

window.addEventListener('hashchange', render);
window.addEventListener('load', render);


