export const DEFAULT_WORLDS = [
  { id: 'portare', name: 'Portare', color: '#b98055', tint: '#f6ede2', icon: 'briefcase', description: 'Build your business, one step at a time.' },
  { id: 'portareos', name: 'PortareOS', color: '#8b79b4', tint: '#efebf7', icon: 'terminal', description: 'A home for the things you are building.' },
  { id: 'job', name: 'Day job', color: '#6f91af', tint: '#eaf0f6', icon: 'building', description: 'Keep the workday clear and contained.' },
  { id: 'personal', name: 'Personal', color: '#7a9d84', tint: '#eaf1e9', icon: 'leaf', description: 'Life outside work deserves space, too.' }
];
export const WORLD_ICONS = ['briefcase', 'terminal', 'building', 'leaf', 'compass', 'heart', 'sprout', 'plans', 'notes', 'sun'];
export const STORAGE_KEY = 'portare-daybook-v1';
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function shiftDate(key, days) { const date = new Date(`${key}T12:00:00`); date.setDate(date.getDate()+days); return dateKey(date); }
export const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`)) && dateKey(new Date(`${value}T12:00:00`)) === value;
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const worldById = (state, id) => state.worlds.find(world => world.id === id) ?? state.worlds[0];
export const defaultWorldId = state => (state.worlds.find(world => world.id === 'personal') ?? state.worlds[0]).id;
export function worldTint(color) {
  return '#' + [1,3,5].map(offset => Math.round(parseInt(color.slice(offset,offset+2),16)*0.12+255*0.88).toString(16).padStart(2,'0')).join('');
}
function worldDefinition(values, worlds, id) {
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  if (!name || name.length > 60) throw new Error('Give your world a name of up to 60 characters.');
  if (worlds.some(world=>world.id!==id && world.name.toLocaleLowerCase()===name.toLocaleLowerCase())) throw new Error('A world with that name already exists.');
  if (!/^#[0-9a-f]{6}$/i.test(values.color)) throw new Error('Choose a valid world color.');
  if (!WORLD_ICONS.includes(values.icon)) throw new Error('Choose an icon from the list.');
  if (description.length > 1000) throw new Error('Keep the description under 1,000 characters.');
  return { id, name, color: values.color.toLowerCase(), tint: worldTint(values.color), icon: values.icon, description };
}
export function addWorld(state, values) {
  if (state.worlds.length >= 100) throw new Error('You can have up to 100 worlds.');
  const world = worldDefinition(values, state.worlds, uid());
  state.worlds.push(world);
  return world;
}
export function updateWorld(state, id, values) {
  const index = state.worlds.findIndex(world=>world.id===id);
  if (index < 0) throw new Error('This world no longer exists.');
  state.worlds[index] = worldDefinition(values, state.worlds, id);
  return state.worlds[index];
}
export function moveWorld(state, id, direction) {
  const index = state.worlds.findIndex(world=>world.id===id);
  const target = index + direction;
  if (index < 0 || ![-1,1].includes(direction) || target < 0 || target >= state.worlds.length) return;
  const [world] = state.worlds.splice(index,1);
  state.worlds.splice(target,0,world);
}
export function removeWorld(state, id, replacementId) {
  if (!state.worlds.some(world=>world.id===id)) throw new Error('This world no longer exists.');
  if (state.worlds.length <= 1) throw new Error('Keep at least one world for your tasks, plans, and notes.');
  if (id===replacementId || !state.worlds.some(world=>world.id===replacementId)) throw new Error('Choose another world for its contents.');
  for (const collection of [state.tasks,state.plans,state.notes]) {
    for (const item of collection) if (item.area===id) item.area=replacementId;
  }
  state.worlds = state.worlds.filter(world=>world.id!==id);
}
export function clearSampleContent(state) {
  const result = structuredClone(state);
  result.tasks = result.tasks.filter(task=>!task.sample);
  result.notes = result.notes.filter(note=>!note.sample);
  const linkedIds = new Set([...result.tasks,...result.notes].map(item=>item.planId));
  result.plans = result.plans.filter(plan=>!plan.sample || linkedIds.has(plan.id));
  result.settings.sampleNotice = false;
  return result;
}
export const timeLabel = minutes => minutes >= 60 ? `${Math.floor(minutes/60)}h${minutes%60 ? ` ${minutes%60}m` : ''}` : `${minutes}m`;
export const isTodayTask = (task, today) => !task.completedAt && Boolean((task.date && task.date <= today) || (task.deadline && task.deadline <= today));
export function taskMatches(task, view, today) {
  if (view === 'completed') return Boolean(task.completedAt);
  if (task.completedAt) return false;
  if (view === 'today') return isTodayTask(task, today);
  if (view === 'upcoming') return Boolean((task.date && task.date > today) || (task.deadline && task.deadline > today));
  if (view === 'inbox') return !task.date;
  if (view.startsWith('area:')) return task.area === view.slice(5);
  return true;
}
export function makeSeed(today = dateKey()) {
  const now = new Date().toISOString();
  const task = (id, title, area, date, duration, focus, planId = '', extra = {}) => ({id,title,area,date,deadline:'',duration,focus,planId,notes:'',completedAt:'',createdAt:now,sample:true,...extra});
  return {
    version: 2, worlds: structuredClone(DEFAULT_WORLDS), settings: { capacity: 180, sampleNotice: true }, reflections: {},
    tasks: [
      task('t2','Choose the next PortareOS milestone','portareos',today,45,true,'p2'),
      task('t3','Review this week’s work priorities','job',today,20,true),
      task('t4','Make time for one personal obligation','personal',today,30,false,'p4'),
      task('t5','Review Portare’s next business steps','portare',shiftDate(today,1),30,false,'p3'),
      task('t7','Break the next milestone into small tasks','portareos',shiftDate(today,3),30,false,'p2'),
      task('t9','Capture ideas for Portare','portare','',15,false,'p3'),
      task('t10','Plan a proper evening off','personal',shiftDate(today,4),0,false,'p4'),
      task('t11','Set up my personal planning space','personal',today,15,false,'',{completedAt:now})
    ],
    plans: [
      {id:'p4',title:'Make room for life outside work',outcome:'Keep space for the people, routines, and personal commitments that matter to me.',area:'personal',targetDate:shiftDate(today,30),status:'active',sample:true},
      {id:'p2',title:'Move PortareOS forward',outcome:'Turn the next meaningful milestone into a clear, manageable set of steps.',area:'portareos',targetDate:shiftDate(today,60),status:'active',sample:true},
      {id:'p3',title:'Give Portare a clear direction',outcome:'Choose the business priorities that fit the time and energy I actually have.',area:'portare',targetDate:shiftDate(today,90),status:'active',sample:true}
    ],
    notes: [
      {id:'n4',title:'What matters this month',body:'A little perspective\n\nWhat deserves my time and attention?\n\nWhat can wait?\n\nWho do I want to make time for?\n\nOne small thing I can do this week',area:'personal',planId:'p4',updatedAt:now,sample:true},
      {id:'n2',title:'PortareOS — the bigger picture',body:'What am I building, and why?\n\nThe next meaningful milestone\n\nIdeas to revisit later\n\nDecisions and the reasons behind them',area:'portareos',planId:'p2',updatedAt:now,sample:true},
      {id:'n3',title:'A few things to remember',body:'This space is for the thoughts that do not need to become tasks.\n\nI have several important parts of my life. Progress does not have to happen in all of them every day.',area:'personal',planId:'',updatedAt:now,sample:true}
    ]
  };
}
export function validateState(input) {
  if (!input || ![1,2].includes(input.version) || !Array.isArray(input.tasks) || !Array.isArray(input.plans) || !Array.isArray(input.notes)) throw new Error('This is not a Daybook backup.');
  if (input.tasks.length + input.plans.length + input.notes.length > 20000) throw new Error('This backup is too large.');
  const result = structuredClone(input);
  // Upgrade older fixed-world data, keeping user-created work and retiring obsolete examples.
  if (result.version === 1) {
    result.worlds = structuredClone(DEFAULT_WORLDS);
    const known = new Set(result.worlds.map(world=>world.id));
    const removedPlans = new Set(result.plans.filter(plan=>plan?.sample===true && !known.has(plan.area)).map(plan=>plan.id));
    for (const key of ['tasks','plans','notes']) {
      result[key] = result[key].filter(item=>!(item?.sample===true && !known.has(item.area)));
      for (const item of result[key]) {
        if (!item || typeof item.area !== 'string') throw new Error('A record in this backup is invalid.');
        if (!known.has(item.area)) item.area = defaultWorldId(result);
        if (removedPlans.has(item.planId)) item.planId = '';
      }
    }
    result.version = 2;
  }
  if (!Array.isArray(result.worlds) || result.worlds.length < 1 || result.worlds.length > 100) throw new Error('A backup must include between 1 and 100 worlds.');
  const worldIds = new Set();
  const worldNames = new Set();
  for (const world of result.worlds) {
    if (!world || typeof world.id!=='string' || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(world.id) || world.id==='all' || worldIds.has(world.id)) throw new Error('A world in this backup is invalid.');
    worldDefinition(world, [], world.id);
    if (typeof world.name!=='string' || world.name!==world.name.trim() || worldNames.has(world.name.toLocaleLowerCase()) || typeof world.description!=='string' || typeof world.tint!=='string' || !/^#[0-9a-f]{6}$/i.test(world.tint)) throw new Error('A world in this backup is invalid.');
    worldIds.add(world.id);
    worldNames.add(world.name.toLocaleLowerCase());
  }
  const ids = new Set();
  const text = (value, max = 100000) => typeof value === 'string' && value.length <= max;
  const base = item => {
    if (!item || !text(item.id,100) || !item.id || ids.has(item.id) || !text(item.title,500) || !item.title.trim() || !worldIds.has(item.area) || ('sample' in item && typeof item.sample!=='boolean')) throw new Error('A record in this backup is invalid.');
    ids.add(item.id);
  };
  for (const plan of result.plans) {base(plan);if (!text(plan.outcome) || (plan.targetDate !== '' && !isDate(plan.targetDate)) || !['active','waiting','done'].includes(plan.status)) throw new Error('A plan in this backup is invalid.');}
  const planIds = new Set(result.plans.map(p=>p.id));
  const validPlan = value => value === '' || planIds.has(value);
  for (const task of result.tasks) {
    base(task);
    if ((task.date !== '' && !isDate(task.date)) || (task.deadline !== '' && !isDate(task.deadline)) || !Number.isInteger(task.duration) || task.duration < 0 || task.duration > 1440 || typeof task.focus !== 'boolean' || !validPlan(task.planId) || !text(task.notes) || !text(task.createdAt,100) || !Number.isFinite(Date.parse(task.createdAt)) || !text(task.completedAt,100) || (task.completedAt && !Number.isFinite(Date.parse(task.completedAt)))) throw new Error('A task in this backup is invalid.');
  }
  for (const note of result.notes) {base(note);if (!text(note.body) || !validPlan(note.planId) || !text(note.updatedAt,100) || !Number.isFinite(Date.parse(note.updatedAt))) throw new Error('A note in this backup is invalid.');}
  if (!result.settings || !Number.isInteger(result.settings.capacity) || result.settings.capacity < 15 || result.settings.capacity > 1440) throw new Error('Daily capacity in this backup is invalid.');
  if (result.reflections && (typeof result.reflections !== 'object' || Array.isArray(result.reflections) || Object.entries(result.reflections).some(([key,value])=>!isDate(key)||!text(value)))) throw new Error('Daily notes in this backup are invalid.');
  result.reflections ??= {};
  return result;
}
export function planProgress(planId, tasks) {
  const linked = tasks.filter(task=>task.planId===planId);
  const done = linked.filter(task=>task.completedAt).length;
  return {total:linked.length,done,percent:linked.length ? Math.round(done/linked.length*100) : 0};
}
export function weekDates(today) {
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const start = shiftDate(today, -(weekday === 0 ? 6 : weekday-1));
  return Array.from({length:7},(_,i)=>shiftDate(start,i));
}
