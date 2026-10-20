import { STORAGE_KEY, dateKey, shiftDate, uid, worldById, defaultWorldId, WORLD_ICONS, addWorld, updateWorld, moveWorld, removeWorld, clearSampleContent, timeLabel, isTodayTask, taskMatches, makeSeed, validateState, planProgress, weekDates, isDate } from './model.js';

const paths = {
  home:'m3 10 9-7 9 7v10H3V10Zm5 10v-7h8v7', sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  calendar:'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2', inbox:'M4 4h16l2 12v4H2v-4L4 4Zm-2 12h6l2 3h4l2-3h6',
  plans:'M4 20V4h16l-4 5 4 5H4', notes:'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4', check:'m5 12 4 4L19 6', 'check-circle':'M21 11v1a9 9 0 1 1-5.3-8.2M9 11l3 3 9-9',
  search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', plus:'M12 5v14M5 12h14', x:'m6 6 12 12M6 18 18 6', star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L2 9.6l6.2-.9L12 3Z',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2', 'arrow-right':'M4 12h16m-6-6 6 6-6 6', 'arrow-left':'M20 12H4m6-6-6 6 6 6', 'chevron-down':'m6 9 6 6 6-6', 'chevron-right':'m9 6 6 6-6 6',
  'arrow-up':'M12 20V4m-6 6 6-6 6 6', 'arrow-down':'M12 4v16m-6-6 6 6 6-6',
  briefcase:'M3 7h18v13H3zM8 7V4h8v3M3 12c6 3 12 3 18 0M10 12h4v4h-4z', terminal:'M3 4h18v16H3zM7 8l4 4-4 4m6 0h4', building:'M5 21V3h14v18M2 21h20M9 7h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-5 6v-3h4v3',
  compass:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 8l-2.5 6.5L7 17l2.5-6.5L16 8Z', leaf:'M20 4C10 2 2 7 5 15c3 8 17 4 15-11ZM4 21 15 10', sprout:'M12 22V12m0 5C4 18 2 13 3 9c7-1 10 2 9 8Zm0-5c-1-7 2-10 9-9 1 6-3 10-9 9Z',
  sliders:'M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6m-4 4v6', lock:'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3', edit:'m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5', trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5', info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 11v6m0-10v.01', menu:'M4 6h16M4 12h16M4 18h16', link:'m10 13 4-4M8 16l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 6a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2', archive:'M3 3h18v5H3zM5 8v13h14V8m-10 4h6', heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'
};
const icon = (name, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] ?? paths.notes}"/></svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const styleArea = area => `--area-color:${area.color};--area-tint:${area.tint}`;
const areaById = id => worldById(state, id);
const areaTag = id => { const area=areaById(id); return `<span class="area-tag" style="${styleArea(area)}"><span class="tag-dot"></span>${esc(area.name)}</span>`; };
const displayDate = (key, options={month:'short',day:'numeric'}) => key && isDate(key) ? new Date(`${key}T12:00:00`).toLocaleDateString('en-GB',options) : 'No date';
const relativeDate = key => key===dateKey() ? 'Today' : key===shiftDate(dateKey(),1) ? 'Tomorrow' : displayDate(key);
const main = document.querySelector('#main-content');
const dialog = document.querySelector('#editor-dialog');
let state;
let storageIssue = '';
let persistenceBlocked = false;
try {const saved=localStorage.getItem(STORAGE_KEY);state=saved ? validateState(JSON.parse(saved)) : makeSeed();}
catch {state={...makeSeed(),tasks:[],plans:[],notes:[]};storageIssue='Your saved data could not be read. Your original data has been preserved. Export any new work before leaving this tab, or restore a valid backup in Settings.';persistenceBlocked=true;}
let route = readRoute();
let filter = 'all';
let sort = 'priority';
let showCompleted = false;
let selectedNote = '';
let toastTimeout;
let undoAction;
let noteSaveTimeout;
let refreshDay = dateKey();

function readRoute() {
  let value;
  try { value=decodeURIComponent(location.hash.slice(1)) || 'today'; } catch { return 'today'; }
  if (['today','upcoming','inbox','plans','notes','completed','all'].includes(value)) return value;
  if (value.startsWith('area:') && state.worlds.some(area=>area.id===value.slice(5))) return value;
  if (value.startsWith('plan:')) return value;
  if (value.startsWith('day:') && isDate(value.slice(4))) return value;
  return 'today';
}
function save() {
  if (persistenceBlocked) {document.querySelector('#save-status').textContent='Export to keep changes';return false;}
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));document.querySelector('#save-status').textContent='Saved on this device';return true;}
  catch {storageIssue='Your browser could not save changes. Export a backup from Settings before closing this tab.';document.querySelector('#save-status').textContent='Changes need a backup';showToast(storageIssue);return false;}
}
function go(next) {if (route===next) {render();closeSidebar();return;}location.hash=next;}
function showToast(message, action=null) {
  clearTimeout(toastTimeout);const toast=document.querySelector('#toast');undoAction=action;
  toast.innerHTML=`<span>${esc(message)}</span>${action ? '<button id="undo-button">Undo</button>' : ''}`;
  toast.classList.add('visible');toastTimeout=setTimeout(()=>{toast.classList.remove('visible');undoAction=null;},action?9000:4500);
}
function closeSidebar(){document.querySelector('#sidebar').classList.remove('open');document.querySelector('#sidebar-scrim').hidden=true;}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
function routeTitle() {
  if(route.startsWith('area:'))return areaById(route.slice(5)).name;
  if(route.startsWith('plan:'))return state.plans.find(plan=>plan.id===route.slice(5))?.title ?? 'Plans';
  if(route.startsWith('day:'))return relativeDate(route.slice(4));
  return ({today:'Today',upcoming:'Upcoming',inbox:'Inbox',plans:'Long-term plans',notes:'Notes',completed:'Completed',all:'All tasks'})[route];
}
function renderNav() {
  const items=[['today','sun','Today'],['upcoming','calendar','Upcoming'],['inbox','inbox','Inbox'],['plans','plans','Long-term plans'],['notes','notes','Notes'],['completed','check-circle','Completed']];
  document.querySelector('#main-nav').innerHTML=items.map(([view,ico,label])=>{
    const count=view==='plans'?state.plans.filter(p=>p.status!=='done').length:view==='notes'?state.notes.length:state.tasks.filter(task=>taskMatches(task,view,dateKey())).length;
    const active=route===view||(view==='today'&&route.startsWith('day:'))||(view==='plans'&&route.startsWith('plan:'));
    return `<a href="#${view}" class="nav-item${active?' active':''}" ${active?'aria-current="page"':''}>${icon(ico)}<span>${label}</span>${count?`<span class="nav-count">${count}</span>`:''}</a>`;
  }).join('');
  document.querySelector('#area-nav').innerHTML=state.worlds.map(area=>`<a href="#area:${esc(area.id)}" class="nav-item area-item${route===`area:${area.id}`?' active':''}" style="${styleArea(area)}" ${route===`area:${area.id}`?'aria-current="page"':''}><span class="world-dot"></span><span>${esc(area.name)}</span><span class="nav-count">${state.tasks.filter(t=>t.area===area.id&&!t.completedAt).length||''}</span></a>`).join('');
  document.querySelector('#worlds-count').textContent=state.worlds.length;
  document.querySelector('#breadcrumb-title').textContent=routeTitle();
}
function heading(title,subtitle,action='task',eyebrow='YOUR PERSONAL DAYBOOK') {
  const label={task:'Add task',plan:'New plan',note:'New note'}[action];
  return `<div class="page-heading"><div><div class="eyebrow">${icon('sun')}${esc(eyebrow)}</div><h1>${esc(title)}<span class="heading-dot">.</span></h1><p class="subtitle">${esc(subtitle)}</p></div>${label?`<button class="button primary" data-action="new-${action}">${icon('plus')}${label}</button>`:''}</div>`;
}
function notice() {
  return state.settings.sampleNotice ? `<div class="sample-notice">${icon('sprout')}<span>A starting point, just for you. These are sample tasks, plans, and notes.</span><button class="quiet-button" data-action="clear-samples">Start fresh</button><button class="icon-button" data-action="dismiss-samples" aria-label="Dismiss sample notice">${icon('x')}</button></div>` : '';
}
function filters() {
  return `<div class="filter-pills" role="group" aria-label="Filter by life area"><button class="filter-pill${filter==='all'?' active':''}" data-area="all" aria-pressed="${filter==='all'}">All worlds</button>${state.worlds.map(area=>`<button class="filter-pill${filter===area.id?' active':''}" data-area="${esc(area.id)}" aria-pressed="${filter===area.id}" style="${styleArea(area)}"><span class="world-dot"></span>${esc(area.name)}</button>`).join('')}</div>`;
}
function empty(title,copy,ico='leaf',action='new-task',label='Add a task') {
  return `<div class="empty-state">${icon(ico)}<h3>${esc(title)}</h3><p>${esc(copy)}</p>${action?`<button class="button secondary" data-action="${action}">${icon('plus')}${esc(label)}</button>`:''}</div>`;
}
function sortedTasks(tasks) {
  return [...tasks].sort((a,b)=>{
    if(sort==='shortest') return a.duration-b.duration;
    if(sort==='area') return state.worlds.findIndex(x=>x.id===a.area)-state.worlds.findIndex(x=>x.id===b.area);
    return Number(b.focus)-Number(a.focus)||(a.deadline||'9999').localeCompare(b.deadline||'9999')||a.createdAt.localeCompare(b.createdAt);
  });
}
function taskRow(task) {
  const plan=state.plans.find(plan=>plan.id===task.planId);
  const today=dateKey();
  const overdue=(task.deadline&&task.deadline<today)||(task.date&&task.date<today);
  return `<div class="task-row${task.completedAt?' completed':''}" data-task-row="${esc(task.id)}"><button class="check-button${task.completedAt?' checked':''}" data-complete="${esc(task.id)}" aria-label="${task.completedAt?'Reopen':'Complete'} ${esc(task.title)}" aria-pressed="${Boolean(task.completedAt)}">${task.completedAt?icon('check'):''}</button><button class="task-main" data-edit-task="${esc(task.id)}"><span class="task-title">${esc(task.title)}</span><span class="task-meta">${areaTag(task.area)}${plan?`<span class="meta-plan">${icon('plans')}${esc(plan.title)}</span>`:''}${!task.completedAt&&overdue?`<span class="due-label">${icon('calendar')}${task.deadline&&task.deadline<today?'Overdue':'Carried over'}</span>`:task.deadline?`<span class="due-label">${icon('calendar')}Due ${esc(relativeDate(task.deadline))}</span>`:''}</span></button><span class="task-duration">${task.duration?`${icon('clock')}${timeLabel(task.duration)}`:'—'}</span><button class="icon-button star-button${task.focus?' on':''}" data-focus="${esc(task.id)}" aria-label="${task.focus?'Remove from':'Add to'} focus: ${esc(task.title)}" aria-pressed="${task.focus}">${icon('star')}</button></div>`;
}
function quickAdd() {return `<form class="quick-add" id="quick-add-form">${icon('plus')}<input name="title" aria-label="Quick add a task" placeholder="Something on your mind? Add a task…" maxlength="500" autocomplete="off" required><button type="submit">↵ <span class="quick-add-label">to add</span></button></form>`;}
function weekStrip(selected) {
  return `<div class="week-strip" aria-label="This week">${weekDates(selected).map(key=>`<button class="day-cell${key===selected?' active':''}${key===dateKey()?' is-today':''}" data-day="${key}" aria-label="${displayDate(key,{weekday:'long',month:'long',day:'numeric'})}" aria-pressed="${key===selected}"><span>${displayDate(key,{weekday:'short'})}</span><span class="day-number">${new Date(`${key}T12:00:00`).getDate()}</span><span class="day-indicator${state.tasks.some(t=>t.date===key&&!t.completedAt)?'':' empty'}"></span></button>`).join('')}</div>`;
}
function focusCards(tasks) {
  const focused=tasks.filter(task=>task.focus);
  return `<section class="focus-section"><div class="section-heading"><h2 class="focus-caption">${icon('star')} KEEP IN FOCUS</h2><span class="section-caption">${focused.length?`${focused.length} priorit${focused.length===1?'y':'ies'} · one step at a time`:'Choose what matters most'}</span><button class="quiet-button" data-action="focus-help" aria-label="About the focus list">${icon('info')}</button></div><div class="focus-cards">${focused.length?focused.slice(0,4).map((task,i)=>{const area=areaById(task.area);return `<button class="focus-card" data-edit-task="${esc(task.id)}"><div class="focus-card-top">${icon(area.icon)}<span>${esc(area.name)}</span><span class="focus-index">0${i+1}</span></div><h3>${esc(task.title)}</h3><div class="focus-card-footer"><span>${icon('clock')}${task.duration?`${timeLabel(task.duration)} · a little progress`:'At your own pace'}</span>${icon('arrow-right','arrow')}</div></button>`;}).join(''):`<div class="focus-empty">Star a task to give it a little more space here. One or two priorities are a good place to start.</div>`}</div></section>`;
}
function todayAside(tasks,selected) {
  const total=tasks.reduce((sum,task)=>sum+task.duration,0);const capacity=state.settings.capacity;const remaining=capacity-total;
  const undated=tasks.filter(t=>!t.duration).length;
  const activeTasks=state.tasks.filter(task=>!task.completedAt);
  return `<aside class="today-aside" aria-label="Daily perspective"><div class="aside-date">${icon('sun')} A little perspective</div><section class="aside-card${remaining<0?' over-capacity':''}"><h2 class="aside-card-title">Room in your day ${icon('clock')}</h2><div class="capacity-amount"><strong>${timeLabel(total)}</strong><span>/ ${timeLabel(capacity)} available</span></div><div class="capacity-bar" role="img" aria-label="${total} minutes planned of ${capacity} minutes available">${state.worlds.map(area=>{const minutes=tasks.filter(t=>t.area===area.id).reduce((s,t)=>s+t.duration,0);return minutes?`<span class="capacity-segment" style="${styleArea(area)};width:${minutes/Math.max(capacity,total)*100}%"></span>`:'';}).join('')}</div><p class="capacity-description">${remaining>=0?`${timeLabel(remaining)} left for the unexpected.`:`${timeLabel(-remaining)} over capacity. Give something another day.`}${undated?` ${undated} task${undated>1?'s':''} without estimates.`:''}</p><div class="capacity-legend"><span><i class="legend-dot" style="--area-color:#a7b690"></i>Planned</span><span><i class="legend-dot" style="--area-color:#e8ecdf"></i>Breathing room</span><button class="capacity-edit" data-action="capacity">${icon('edit')} Adjust</button></div></section><section class="big-picture"><div class="big-picture-header"><h2>Your worlds, at a glance</h2><button class="quiet-button" data-action="all-tasks" aria-label="Show all tasks">${icon('arrow-right')}</button></div>${state.worlds.map(area=>{const all=state.tasks.filter(t=>t.area===area.id);const done=all.filter(t=>t.completedAt).length;return `<div class="world-summary" style="${styleArea(area)}"><div class="world-summary-top"><a href="#area:${esc(area.id)}" class="world-summary-title"><span class="world-dot"></span>${esc(area.name)}</a><span>${activeTasks.filter(t=>t.area===area.id).length} open</span></div><div class="mini-progress" role="img" aria-label="${done} of ${all.length} ${esc(area.name)} tasks completed"><span style="width:${all.length?Math.round(done/all.length*100):0}%"></span></div></div>`;}).join('')}<p class="aside-footnote">Open tasks across all dates.<br>You don’t have to move every world, every day.</p></section><section class="aside-card reflection-card"><h2 class="aside-card-title">A little space to think ${icon('edit')}</h2><textarea id="daily-reflection" aria-label="Daily note for ${displayDate(selected)}" placeholder="A thought, a small win, or something to remember…" maxlength="100000">${esc(state.reflections[selected]||'')}</textarea><div class="reflection-card-footer"><span>${selected===dateKey()?'Just for today':displayDate(selected)}</span><span id="reflection-status">Saved in Notes</span></div></section><div class="next-step">${icon('sprout')}<span>A full life needs <strong>space</strong>,<br>not just a longer list.</span></div></aside>`;
}
function renderToday() {
  const selected=route.startsWith('day:')?route.slice(4):dateKey();const today=dateKey();
  const all=state.tasks.filter(task=>!task.completedAt&&(selected===today?isTodayTask(task,today):task.date===selected||task.deadline===selected));
  const tasks=sortedTasks(all.filter(task=>filter==='all'||task.area===filter));
  const completed=state.tasks.filter(task=>task.completedAt&&dateKey(new Date(task.completedAt))===selected&&(filter==='all'||task.area===filter));
  return `${heading(selected===today?'Today, with intention':displayDate(selected,{weekday:'long',day:'numeric',month:'long'}),'Your work, your projects, and the rest of life.','task',displayDate(selected,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}${notice()}<div class="dashboard-grid"><div class="primary-column">${weekStrip(selected)}${focusCards(all)}<section aria-label="Today’s tasks"><div class="section-heading tasks-header"><h2>${selected===today?'On your list':'The plan'}</h2><span class="count-pill">${tasks.length}</span><select class="sort-select" id="sort-select" aria-label="Sort tasks"><option value="priority"${sort==='priority'?' selected':''}>Focus first</option><option value="shortest"${sort==='shortest'?' selected':''}>Shortest first</option><option value="area"${sort==='area'?' selected':''}>By world</option></select></div>${filters()}<div class="task-list">${tasks.length?tasks.map(taskRow).join(''):empty('A little breathing room',filter==='all'?'Nothing planned here yet. Add a small next step, or let the space be.':'No tasks from this world on this day.','leaf',null)}</div>${quickAdd()}${completed.length?`<button class="completed-toggle" data-action="toggle-completed">${icon(showCompleted?'chevron-down':'chevron-right')}Completed today <span>${completed.length}</span></button>${showCompleted?`<div class="completed-section">${completed.map(taskRow).join('')}</div>`:''}`:''}</section></div>${todayAside(all,selected)}</div>`;
}
function renderTaskPage() {
  const isArea=route.startsWith('area:');const area=isArea?areaById(route.slice(5)):null;
  const title=area?.name??({upcoming:'A little further ahead',inbox:'A place for everything',completed:'Look how far you’ve come',all:'The whole picture'})[route];
  const subtitle=area?.description??({upcoming:'See what’s coming. Make a little room for it.',inbox:'Capture it now. Decide when it belongs later.',completed:'Every checked box is a little more space.',all:'Every task, across every part of your life.'})[route];
  const all=state.tasks.filter(task=>taskMatches(task,route,dateKey()));
  const tasks=sortedTasks(all.filter(task=>filter==='all'||task.area===filter));
  let list='';
  if(route==='upcoming') {
    const groups=new Map();for(const task of tasks){const dates=[task.date,task.deadline].filter(d=>d&&d>dateKey()).sort();const key=dates[0];if(!groups.has(key))groups.set(key,[]);groups.get(key).push(task);}
    list=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,group])=>`<h2 class="list-group-label">${esc(relativeDate(key))}<span>${displayDate(key,{weekday:'long'})} · ${group.length} task${group.length===1?'':'s'}</span></h2><div class="task-list">${group.map(taskRow).join('')}</div>`).join('');
  } else list=`<div class="task-list">${tasks.map(taskRow).join('')}</div>`;
  const plans=isArea?state.plans.filter(p=>p.area===area.id&&p.status!=='done'):[];
  return `<div class="wide-section">${heading(title,subtitle,route==='completed'?'':'task',area?'YOUR WORLDS':'A LITTLE CLARITY')}${notice()}${route==='inbox'?`<div class="inbox-hint">${icon('inbox')}<span>A landing place for tasks without a scheduled day. Give them a date when you’re ready. Deadlines still bring tasks into Today when they’re due.</span></div>`:''}${plans.length?`<div class="section-heading"><h2>The bigger picture</h2><a class="quiet-button" href="#plans">All plans ${icon('arrow-right')}</a></div><div class="plan-grid">${plans.map(planCard).join('')}</div>`:''}<div class="section-heading"><h2>${route==='completed'?'Finished tasks':'Your tasks'}</h2><span class="count-pill">${tasks.length}</span>${route!=='completed'?`<select class="sort-select" id="sort-select" aria-label="Sort tasks"><option value="priority"${sort==='priority'?' selected':''}>Focus first</option><option value="shortest"${sort==='shortest'?' selected':''}>Shortest first</option><option value="area"${sort==='area'?' selected':''}>By world</option></select>`:''}</div>${!isArea?filters():''}${tasks.length?list:empty(route==='completed'?'Good things take small steps':'Some space to think',route==='inbox'?'Capture a thought here. It doesn’t need a date or a perfect plan.':route==='upcoming'?'Tasks scheduled for future days will show up here.':route==='completed'?'Your completed tasks will collect here as you go.':'Add the next small thing you want to move forward.','leaf',route==='completed'?null:'new-task')}${route!=='completed'?quickAdd():''}</div>`;
}
function planCard(plan) {
  const progress=planProgress(plan.id,state.tasks);const area=areaById(plan.area);
  return `<button class="plan-card" data-plan="${esc(plan.id)}" style="${styleArea(area)}"><div class="plan-card-top">${areaTag(plan.area)}${icon('arrow-right')}</div><h3>${esc(plan.title)}</h3><p>${esc(plan.outcome)}</p><div class="plan-status">${icon(plan.status==='done'?'check-circle':plan.status==='waiting'?'clock':'calendar')}${plan.status==='done'?'Completed':plan.status==='waiting'?'On hold':plan.targetDate?`Aiming for ${displayDate(plan.targetDate)}`:'An open horizon'}</div><div class="plan-progress" role="img" aria-label="${progress.done} of ${progress.total} tasks complete"><span style="width:${progress.percent}%"></span></div><div class="plan-card-footer"><span>${progress.done} of ${progress.total} steps</span><span>${plan.status==='active'?'In progress':plan.status==='waiting'?'On hold':'Complete'}</span></div></button>`;
}
function renderPlans() {
  const plans=state.plans.filter(plan=>filter==='all'||plan.area===filter);
  const active=plans.filter(p=>p.status==='active');const other=plans.filter(p=>p.status!=='active');
  const today=dateKey();
  return `<div class="wide-section">${heading('Make room for the bigger things','A direction to grow toward. Small steps to get there.','plan','THE LONG VIEW')}${notice()}<div class="horizon-strip"><div class="horizon-item"><strong>${active.filter(p=>p.targetDate&&p.targetDate<=shiftDate(today,30)).length}</strong><span>Plans in the next 30 days</span></div><div class="horizon-item"><strong>${active.filter(p=>!p.targetDate||p.targetDate>shiftDate(today,30)).length}</strong><span>On the longer horizon</span></div><div class="horizon-item"><strong>${state.tasks.filter(t=>t.planId&&!t.completedAt).length}</strong><span>Small steps ahead</span></div></div>${filters()}<div class="section-heading"><h2>Moving forward</h2><span class="count-pill">${active.length}</span></div>${active.length?`<div class="plan-grid">${active.map(planCard).join('')}</div>`:empty('A direction, at your own pace','Create a plan for something that matters. Give it an outcome, then add the small steps.','plans','new-plan','Create a plan')}${other.length?`<div class="section-heading"><h2>On hold & completed</h2></div><div class="plan-grid">${other.map(planCard).join('')}</div>`:''}</div>`;
}
function renderPlanDetail() {
  const plan=state.plans.find(p=>p.id===route.slice(5));if(!plan)return empty('This plan isn’t here','Choose a plan from the long-term view.','plans','show-plans','See all plans');
  const tasks=state.tasks.filter(t=>t.planId===plan.id);const notes=state.notes.filter(n=>n.planId===plan.id);const progress=planProgress(plan.id,state.tasks);
  return `<div class="wide-section"><button class="quiet-button" data-action="show-plans">${icon('arrow-left')} All plans</button>${heading(plan.title,'Small steps, with the bigger picture in mind.','task','THE LONG VIEW')}<div class="plan-detail-heading">${areaTag(plan.area)}<button class="button secondary" data-edit-plan="${esc(plan.id)}">${icon('edit')} Edit plan</button></div><div class="plan-detail-outcome">${esc(plan.outcome||'What would meaningful progress look like? Edit this plan to describe the outcome.')}</div><div class="stats-row"><span class="stat-item">${icon('calendar')}${plan.targetDate?`Aiming for ${displayDate(plan.targetDate,{day:'numeric',month:'long',year:'numeric'})}`:'No target date'}</span><span class="stat-item"><strong>${progress.done}/${progress.total}</strong> steps complete</span><span class="stat-item">${plan.status==='active'?'In progress':plan.status==='waiting'?'On hold':'Completed'}</span></div><div class="plan-detail-grid"><section><div class="section-heading"><h2>The next small steps</h2><span class="count-pill">${tasks.filter(t=>!t.completedAt).length}</span></div><div class="task-list">${tasks.filter(t=>!t.completedAt).map(taskRow).join('')}${tasks.filter(t=>t.completedAt).map(taskRow).join('')}</div>${quickAdd()}</section><section><div class="section-heading"><h2>Thoughts & notes</h2><button class="quiet-button" data-action="new-note">${icon('plus')} Add note</button></div>${notes.length?notes.map(note=>`<button class="linked-note" data-note="${esc(note.id)}"><h3>${esc(note.title)}</h3><p>${esc(note.body.slice(0,150)||'A little space to think…')}</p></button>`).join(''):empty('Keep the context','Collect ideas, decisions, project details, and anything worth keeping.','notes','new-note','Add a note')}</section></div></div>`;
}
function filteredNotes(){return state.notes.filter(n=>filter==='all'||n.area===filter).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
function renderNotes() {
  const notes=filteredNotes();
  if(!notes.some(n=>n.id===selectedNote))selectedNote=notes[0]?.id??'';
  const note=state.notes.find(n=>n.id===selectedNote);
  const daily=Object.entries(state.reflections).filter(([,body])=>body.trim()).sort((a,b)=>b[0].localeCompare(a[0]));
  return `${heading('A home for your thoughts','Ideas, details, and the things a checkbox can’t hold.','note','LEAVE YOURSELF A NOTE')}${notice()}${filters()}<div class="notes-layout"><div class="note-list" id="note-list" aria-label="Your notes">${notes.length?notes.map(noteListItem).join(''):empty('A clean page','Your notes will live here.','notes',null)}</div>${note?`<section class="note-editor" aria-label="Note editor"><div class="note-editor-top"><select id="note-area" class="note-area-select" aria-label="Note life area">${areaOptions(note.area)}</select><div class="note-controls"><select id="note-plan" class="note-plan-select" aria-label="Linked plan">${planOptions(note.planId,note.area)}</select><button class="icon-button delete-note-icon danger" data-delete-note="${esc(note.id)}" aria-label="Delete note">${icon('trash')}</button></div></div><input id="note-title" class="note-title-input" aria-label="Note title" maxlength="500" value="${esc(note.title)}" placeholder="Untitled thought"><textarea id="note-body" class="note-body-input" aria-label="Note content" placeholder="Start anywhere. This space is yours…" maxlength="100000">${esc(note.body)}</textarea><div class="note-status"><span id="note-save-status">${icon('check')} Saved on this device</span><span id="note-word-count">${wordCount(note.body)} words</span></div></section>`:empty('There’s room for your thoughts','Start a note. Keep an idea, think through a decision, or collect details for a plan.','notes','new-note','Write a note')}</div><p class="notes-info">Notes save as you type. Daily notes from your Today view are kept below.</p>${daily.length?`<section><h2 class="subheading">Little notes from your days</h2><div class="daily-note-list">${daily.map(([key,body])=>`<article class="daily-note-card"><time datetime="${key}">${displayDate(key,{weekday:'short',day:'numeric',month:'long',year:'numeric'})}</time><p>${esc(body)}</p></article>`).join('')}</div></section>`:''}`;
}
function wordCount(value){return value.trim()?value.trim().split(/\s+/).length:0;}
function noteListItem(note) {return `<button class="note-list-item${selectedNote===note.id?' active':''}" data-select-note="${esc(note.id)}" aria-pressed="${selectedNote===note.id}"><h3>${esc(note.title)}</h3><p>${esc(note.body.slice(0,100)||'A little space to think…')}</p><div class="note-list-bottom">${areaTag(note.area)}<span class="note-date">${displayDate(dateKey(new Date(note.updatedAt)))}</span></div></button>`;}
function updateNoteList(){const list=document.querySelector('#note-list');if(list)list.innerHTML=filteredNotes().map(noteListItem).join('');}
function render() {
  if (filter!=='all' && !state.worlds.some(world=>world.id===filter)) filter='all';
  if (route.startsWith('area:') && !state.worlds.some(world=>world.id===route.slice(5))) {
    route='today';history.replaceState(null,'','#today');
  }
  renderNav();
  let body=route==='today'||route.startsWith('day:')?renderToday():route==='plans'?renderPlans():route.startsWith('plan:')?renderPlanDetail():route==='notes'?renderNotes():renderTaskPage();
  main.innerHTML=(storageIssue?`<div class="storage-alert" role="alert">${esc(storageIssue)}</div>`:'')+body;
}
function areaOptions(value){return state.worlds.map(area=>`<option value="${esc(area.id)}"${value===area.id?' selected':''}>${esc(area.name)}</option>`).join('');}
function planOptions(value,area){return `<option value="">No linked plan</option>${state.plans.filter(p=>p.id===value||(!area||p.area===area)&&p.status!=='done').map(plan=>`<option value="${esc(plan.id)}"${value===plan.id?' selected':''}>${esc(plan.title)}</option>`).join('')}`;}
function defaultContext() {
  const plan=route.startsWith('plan:')?state.plans.find(p=>p.id===route.slice(5)):null;
  return {area:plan?.area??(route.startsWith('area:')?route.slice(5):filter!=='all'?filter:defaultWorldId(state)),planId:plan?.id??'',date:route==='today'?dateKey():route==='upcoming'?shiftDate(dateKey(),1):route.startsWith('day:')?route.slice(4):''};
}
function openDialog(title,subtitle,body) {
  if(dialog.open)dialog.close();
  document.querySelector('#dialog-content').innerHTML=`<header class="dialog-header"><div><h2>${esc(title)}</h2><p class="dialog-subtitle">${esc(subtitle)}</p></div><button class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('x')}</button></header><div class="dialog-body">${body}</div>`;
  dialog.setAttribute('aria-label',title);dialog.showModal();
}
function openTask(id) {
  const task=state.tasks.find(t=>t.id===id);const values=task??{title:'',...defaultContext(),deadline:'',duration:30,notes:'',focus:false};
  openDialog(task?'A little detail':'One small next step',task?'Make this task work for your day.':'It doesn’t need to be a perfect plan.',`<form id="task-form" data-id="${esc(task?.id||'')}"><label class="form-field"><span class="field-label">What needs doing?</span><input name="title" maxlength="500" required autofocus value="${esc(values.title)}" placeholder="A clear, small next step"></label><div class="form-grid"><label class="form-field"><span class="field-label">World</span><select name="area" id="task-area">${areaOptions(values.area)}</select></label><label class="form-field"><span class="field-label">Long-term plan <small>optional</small></span><select name="planId" id="task-plan">${planOptions(values.planId,values.area)}</select></label></div><div class="form-grid"><label class="form-field"><span class="field-label">When will you work on it?</span><input type="date" name="date" value="${esc(values.date)}"><span class="task-help">Leave blank to keep it in your inbox.</span></label><label class="form-field"><span class="field-label">Time estimate <small>minutes</small></span><input type="number" min="0" max="1440" step="1" name="duration" value="${values.duration}" required></label></div><label class="form-field"><span class="field-label">Deadline <small>only if there is one</small></span><input type="date" name="deadline" value="${esc(values.deadline)}"></label><label class="form-field"><span class="field-label">Notes <small>context, links, or a reminder</small></span><textarea name="notes" maxlength="100000" placeholder="Anything that will help future you…">${esc(values.notes)}</textarea></label><label class="form-field"><span class="checkbox-label"><input type="checkbox" name="focus"${values.focus?' checked':''}>${icon('star')} Keep in focus</span></label><div class="dialog-footer">${task?`<button class="button danger" type="button" data-delete-task="${esc(task.id)}">${icon('trash')} Delete task</button>`:''}<button class="button secondary" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">${task?'Save changes':'Add task'} ${icon('arrow-right')}</button></div></form>`);
}
function openPlan(id) {
  const plan=state.plans.find(p=>p.id===id);const values=plan??{title:'',outcome:'',...defaultContext(),targetDate:'',status:'active'};
  openDialog(plan?'Shape your plan':'Something to grow toward','Give the bigger picture a little clarity.',`<form id="plan-form" data-id="${esc(plan?.id||'')}"><label class="form-field"><span class="field-label">Plan name</span><input name="title" maxlength="500" value="${esc(values.title)}" placeholder="What do you want to move toward?" required autofocus></label><label class="form-field"><span class="field-label">What would a good outcome look like?</span><textarea name="outcome" maxlength="100000" placeholder="Make it meaningful to you…">${esc(values.outcome)}</textarea></label><div class="form-grid"><label class="form-field"><span class="field-label">World</span><select name="area">${areaOptions(values.area)}</select></label><label class="form-field"><span class="field-label">Target date <small>optional</small></span><input type="date" name="targetDate" value="${esc(values.targetDate)}"></label></div><label class="form-field"><span class="field-label">Where does it stand?</span><select name="status"><option value="active"${values.status==='active'?' selected':''}>Moving forward</option><option value="waiting"${values.status==='waiting'?' selected':''}>On hold</option><option value="done"${values.status==='done'?' selected':''}>Complete</option></select></label><div class="dialog-footer">${plan?`<button type="button" class="button danger" data-delete-plan="${esc(plan.id)}">${icon('trash')} Delete plan</button>`:''}<button type="button" class="button secondary" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">${plan?'Save changes':'Create plan'} ${icon('arrow-right')}</button></div></form>`);
}
function newNote() {
  const context=defaultContext();const note={id:uid(),title:'Untitled thought',body:'',area:context.area,planId:context.planId,updatedAt:new Date().toISOString(),sample:false};
  state.notes.unshift(note);selectedNote=note.id;filter='all';save();
  if(route==='notes'){render();document.querySelector('#note-title').focus();document.querySelector('#note-title').select();}else {go('notes');setTimeout(()=>{document.querySelector('#note-title')?.focus();document.querySelector('#note-title')?.select();},30);}
}
function completeTask(id) {
  const task=state.tasks.find(t=>t.id===id);if(!task)return;
  const before=task.completedAt;task.completedAt=task.completedAt?'':new Date().toISOString();task.sample=false;save();render();
  showToast(task.completedAt?'A little more space. Task completed.':'Task is back on your list.',()=>{const current=state.tasks.find(t=>t.id===id);if(current){current.completedAt=before;save();render();}});
}
function toggleFocus(id) {
  const task=state.tasks.find(t=>t.id===id);if(!task)return;
  task.focus=!task.focus;task.sample=false;save();render();if(task.focus&&!isTodayTask(task,dateKey()))showToast('Starred. It will appear in focus on its planned day.');
}
function confirmAction(title,copy,button,onConfirm) {
  openDialog(title,'A quick check before changing things.',`<p class="confirm-copy">${esc(copy)}</p><div class="dialog-footer"><button class="button secondary" data-action="close-dialog">Keep it</button><button class="button primary" id="confirm-action">${esc(button)}</button></div>`);
  document.querySelector('#confirm-action').addEventListener('click',()=>{dialog.close();onConfirm();},{once:true});
}
function deleteTask(id) {
  const task=state.tasks.find(t=>t.id===id);if(!task)return;
  confirmAction('Let this task go?',`“${task.title}” will be removed from your list.`,'Delete task',()=>{state.tasks=state.tasks.filter(t=>t.id!==id);save();render();showToast('Task deleted.',()=>{state.tasks.push(task);save();render();});});
}
function deleteNote(id) {
  const note=state.notes.find(n=>n.id===id);if(!note)return;
  confirmAction('Delete this note?',`“${note.title}” will be removed from your notebook.`,'Delete note',()=>{state.notes=state.notes.filter(n=>n.id!==id);save();render();showToast('Note deleted.',()=>{state.notes.push(note);selectedNote=id;save();render();});});
}
function deletePlan(id) {
  const plan=state.plans.find(p=>p.id===id);if(!plan)return;
  confirmAction('Let this plan go?','The plan will be deleted. Its tasks and notes will stay in their worlds, with the plan link removed.','Delete plan',()=>{
    const linkedTasks=state.tasks.filter(t=>t.planId===id).map(t=>t.id);const linkedNotes=state.notes.filter(n=>n.planId===id).map(n=>n.id);
    state.plans=state.plans.filter(p=>p.id!==id);state.tasks.forEach(t=>{if(t.planId===id)t.planId='';});state.notes.forEach(n=>{if(n.planId===id)n.planId='';});save();go('plans');
    showToast('Plan removed. Its tasks and notes are still here.',()=>{state.plans.push(plan);state.tasks.forEach(t=>{if(linkedTasks.includes(t.id))t.planId=id;});state.notes.forEach(n=>{if(linkedNotes.includes(n.id))n.planId=id;});save();render();});
  });
}
function clearSamples() {
  confirmAction('Make this space yours?','Remove the sample tasks, plans, and notes. Anything you have added or edited will stay.','Start fresh',()=>{
    const prior=structuredClone(state);state=clearSampleContent(state);save();render();showToast('A fresh page. Make it yours.',()=>{state=prior;save();render();});
  });
}
function openCapacity() {
  openDialog('Make some breathing room','How much time can you realistically plan for?',`<form id="capacity-form"><label class="form-field"><span class="field-label">Daily task capacity <small>minutes</small></span><input type="number" name="capacity" value="${state.settings.capacity}" min="15" max="1440" step="1" required autofocus></label><p class="confirm-copy">Use the time you have for the tasks you track here. Leave room for your job, rest, and the unexpected. This is your planning default for each day.</p><div class="dialog-footer"><button class="button secondary" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Save capacity</button></div></form>`);
}
function openSettings() {
  openDialog('Your space, your pace','A few things to keep Daybook working for you.',`<div class="backup-info">This draft saves tasks, plans, and notes in this browser on this device. It doesn’t sync across devices. Export a backup regularly, especially before clearing browser data.</div><section class="settings-block"><h3>Your worlds</h3><p>Define the parts of your life you want to organize. Choose their names, colors, icons, and order.</p><button class="button secondary" data-action="manage-worlds">${icon('sliders')} Manage worlds</button></section><section class="settings-block"><h3>Room in your day</h3><p>Your default daily capacity is ${timeLabel(state.settings.capacity)}. Choose a realistic amount for the tasks you track.</p><button class="button secondary" data-action="capacity">${icon('clock')} Adjust capacity</button></section><section class="settings-block"><h3>Keep a copy</h3><p>Backups include all worlds, tasks, plans, notes, and daily reflections. Restoring a backup replaces the current data in this browser.</p><div class="settings-actions"><button class="button secondary" data-action="export">${icon('download')} Export backup</button><button class="button secondary" data-action="import">${icon('upload')} Restore backup</button></div><input type="file" id="import-file" accept="application/json,.json" hidden><p class="error-message" id="import-error" hidden></p></section><section><h3 class="subheading">A fresh start</h3><p class="confirm-copy">Clear the starter examples while keeping everything you’ve added or edited, including your worlds.</p><button class="button secondary" data-action="clear-samples">${icon('sprout')} Remove sample content</button></section>`);
}
function openWorldManager() {
  openDialog('Your worlds, your way','Make space for the parts of life that matter to you.',`<p class="world-manager-intro">Add a world, give it a name, and make it yours. Changes apply to your tasks, plans, notes, and filters.</p><div class="world-manager-list">${state.worlds.map((world,index)=>{
    const counts=[['tasks',state.tasks],['plans',state.plans],['notes',state.notes]].map(([label,items])=>`${items.filter(item=>item.area===world.id).length} ${label}`).join(' · ');
    return `<div class="world-manager-row" style="${styleArea(world)}"><button class="world-manager-title" data-edit-world="${esc(world.id)}"><span class="world-manager-icon">${icon(world.icon)}</span><span><strong>${esc(world.name)}</strong><small>${counts}</small></span></button><div class="world-manager-actions"><button class="icon-button" data-move-world="${esc(world.id)}" data-direction="-1" aria-label="Move ${esc(world.name)} up"${index===0?' disabled':''}>${icon('arrow-up')}</button><button class="icon-button" data-move-world="${esc(world.id)}" data-direction="1" aria-label="Move ${esc(world.name)} down"${index===state.worlds.length-1?' disabled':''}>${icon('arrow-down')}</button><button class="icon-button" data-edit-world="${esc(world.id)}" aria-label="Edit ${esc(world.name)}">${icon('edit')}</button><button class="icon-button danger" data-delete-world="${esc(world.id)}" aria-label="Remove ${esc(world.name)}"${state.worlds.length===1?' disabled title="Keep at least one world"':''}>${icon('trash')}</button></div></div>`;
  }).join('')}</div><div class="world-manager-footer"><button class="button secondary" data-action="new-world"${state.worlds.length>=100?' disabled':''}>${icon('plus')} Add world</button><button class="button primary" data-action="close-dialog">Done</button></div>`);
}
function openWorld(id) {
  const existing=state.worlds.find(world=>world.id===id);
  const values=existing??{name:'',description:'',color:'#7a9d84',icon:'leaf'};
  openDialog(existing?'Shape your world':'A world of your own','Use a name that makes sense to you.',`<form id="world-form" data-id="${esc(existing?.id||'')}"><label class="form-field"><span class="field-label">World name</span><input name="name" maxlength="60" required autofocus placeholder="For example: Family, Study, Side project" value="${esc(values.name)}"></label><div class="form-grid"><label class="form-field world-color-field"><span class="field-label">Color</span><input type="color" name="color" value="${esc(values.color)}" required></label><label class="form-field"><span class="field-label">Icon</span><select name="icon">${WORLD_ICONS.map(name=>`<option value="${name}"${values.icon===name?' selected':''}>${name==='plans'?'Flag':name.charAt(0).toUpperCase()+name.slice(1)}</option>`).join('')}</select></label></div><label class="form-field"><span class="field-label">A little description <small>optional</small></span><textarea name="description" maxlength="1000" placeholder="What belongs in this part of your life?">${esc(values.description)}</textarea></label><p id="world-form-error" class="error-message" role="alert" hidden></p><div class="dialog-footer"><button type="button" class="button secondary" data-action="manage-worlds">Back</button><button type="submit" class="button primary">${existing?'Save changes':'Create world'}</button></div></form>`);
}
function openRemoveWorld(id) {
  const world=state.worlds.find(item=>item.id===id);
  if(!world||state.worlds.length<=1)return;
  const contents=[...state.tasks,...state.plans,...state.notes].filter(item=>item.area===id).length;
  openDialog(`Remove ${world.name}?`,'Keep the contents. Choose where they belong next.',`<form id="remove-world-form" data-id="${esc(id)}"><p class="confirm-copy">${contents?`${contents} task${contents===1?'':'s'}, plan${contents===1?'':'s'}, or note${contents===1?'':'s'} belong here. Their contents and links will be kept.`:'This world is empty.'} Choose a world to use in its place.</p><label class="form-field"><span class="field-label">Move contents to</span><select name="replacementId" required>${state.worlds.filter(item=>item.id!==id).map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select></label><p id="world-form-error" class="error-message" role="alert" hidden></p><div class="dialog-footer"><button class="button secondary" type="button" data-action="manage-worlds">Keep world</button><button class="button primary" type="submit">Remove world</button></div></form>`);
}
function removeWorldAndKeepContents(id,replacementId) {
  const index=state.worlds.findIndex(world=>world.id===id);
  const world=state.worlds[index];
  const affected=['tasks','plans','notes'].map(key=>[key,state[key].filter(item=>item.area===id).map(item=>item.id)]);
  removeWorld(state,id,replacementId);
  if(filter===id)filter='all';
  if(route===`area:${id}`){route=`area:${replacementId}`;history.replaceState(null,'',`#${route}`);}
  save();render();openWorldManager();
  showToast('World removed. Its contents are still here.',()=>{
    state.worlds.splice(Math.min(index,state.worlds.length),0,world);
    for(const [key,ids] of affected) for(const item of state[key]) if(ids.includes(item.id)&&item.area===replacementId)item.area=id;
    save();render();if(dialog.open)openWorldManager();
  });
}
function exportBackup() {
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`daybook-backup-${dateKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Backup exported. Keep it somewhere safe.');
}
async function importBackup(file) {
  if(!file)return;
  try {
    if(file.size>10*1024*1024)throw new Error('Choose a backup smaller than 10 MB.');
    const imported=validateState(JSON.parse(await file.text()));
    confirmAction('Restore this backup?',`This will replace your current data with ${imported.tasks.length} tasks, ${imported.plans.length} plans, and ${imported.notes.length} notes. Export your current data first if you need to keep it.`,'Restore backup',()=>{
      const old=state;state=imported;persistenceBlocked=false;storageIssue='';
      if(save()){selectedNote='';filter='all';render();showToast('Backup restored.',()=>{state=old;save();render();});}else {render();showToast('Backup loaded for this tab. Browser storage is unavailable; export changes before leaving.');}
    });
  }catch(error){const el=document.querySelector('#import-error');if(el){el.textContent=`Couldn’t restore this file. ${error instanceof SyntaxError?'It is not valid JSON.':error.message}`;el.hidden=false;}else showToast('This file could not be restored.');}
}
function openSearch() {
  openDialog('Find a little clarity','Search your tasks, plans, and notes.',`<input id="global-search" class="search-input" type="search" placeholder="What are you looking for?" aria-label="Search everything" autofocus><div id="search-results" class="search-results"><p class="search-empty">Titles, notes, details — it’s all here.</p></div>`);
}
function updateSearch(query) {
  const term=query.trim().toLocaleLowerCase();const target=document.querySelector('#search-results');
  if(!term){target.innerHTML='<p class="search-empty">Titles, notes, details — it’s all here.</p>';return;}
  const records=[...state.tasks.map(t=>({...t,type:'task',text:t.notes})),...state.plans.map(p=>({...p,type:'plan',text:p.outcome})),...state.notes.map(n=>({...n,type:'note',text:n.body})),...Object.entries(state.reflections).filter(([,v])=>v.trim()).map(([key,body])=>({id:key,title:`Daily note · ${displayDate(key)}`,text:body,type:'daily',area:defaultWorldId(state)}))].filter(item=>`${item.title} ${item.text} ${areaById(item.area).name}`.toLocaleLowerCase().includes(term));
  target.innerHTML=records.length?records.slice(0,40).map(item=>`<button class="search-result" data-search-type="${item.type}" data-search-id="${esc(item.id)}">${icon({task:'check-circle',plan:'plans',note:'notes',daily:'edit'}[item.type])}<span><strong>${esc(item.title)}</strong><small>${esc(areaById(item.area).name)} · ${item.type==='daily'?'Daily reflection':item.type}${item.completedAt?' · completed':''}</small></span></button>`).join(''):'<p class="search-empty">Nothing here yet. Try another word.</p>';
}

document.addEventListener('click',event=>{
  const el=event.target.closest('button,a');if(!el)return;
  if(el.dataset.complete){completeTask(el.dataset.complete);return;}
  if(el.dataset.editTask){openTask(el.dataset.editTask);return;}
  if(el.dataset.focus){toggleFocus(el.dataset.focus);return;}
  if(el.dataset.area){filter=el.dataset.area;render();return;}
  if(el.dataset.day){go(el.dataset.day===dateKey()?'today':`day:${el.dataset.day}`);return;}
  if(el.dataset.plan){go(`plan:${el.dataset.plan}`);return;}
  if(el.dataset.editPlan){openPlan(el.dataset.editPlan);return;}
  if(el.dataset.note){selectedNote=el.dataset.note;filter='all';go('notes');return;}
  if(el.dataset.selectNote){selectedNote=el.dataset.selectNote;render();return;}
  if(el.dataset.deleteTask){deleteTask(el.dataset.deleteTask);return;}
  if(el.dataset.deleteNote){deleteNote(el.dataset.deleteNote);return;}
  if(el.dataset.deletePlan){deletePlan(el.dataset.deletePlan);return;}
  if(el.dataset.editWorld){openWorld(el.dataset.editWorld);return;}
  if(el.dataset.deleteWorld){openRemoveWorld(el.dataset.deleteWorld);return;}
  if(el.dataset.moveWorld){moveWorld(state,el.dataset.moveWorld,Number(el.dataset.direction));save();render();openWorldManager();return;}
  if(el.dataset.searchType){dialog.close();const type=el.dataset.searchType;const id=el.dataset.searchId;if(type==='task')openTask(id);if(type==='plan')go(`plan:${id}`);if(type==='note'){selectedNote=id;filter='all';go('notes');}if(type==='daily')go(id===dateKey()?'today':`day:${id}`);return;}
  const action=el.dataset.action;
  if(action==='new-task')openTask();
  if(action==='new-plan')openPlan();
  if(action==='new-note')newNote();
  if(action==='manage-worlds')openWorldManager();
  if(action==='new-world')openWorld();
  if(action==='close-dialog')dialog.close();
  if(action==='show-plans')go('plans');
  if(action==='dismiss-samples'){state.settings.sampleNotice=false;save();render();}
  if(action==='clear-samples')clearSamples();
  if(action==='toggle-completed'){showCompleted=!showCompleted;render();}
  if(action==='capacity')openCapacity();
  if(action==='all-tasks')go('all');
  if(action==='export')exportBackup();
  if(action==='import')document.querySelector('#import-file')?.click();
  if(action==='focus-help')openDialog('A small focus, a little momentum','Give the important things a place to stand.',`<p class="confirm-copy">Star any task to keep it in focus on its planned day. Overdue tasks stay visible until you finish or reschedule them. You can star as many as you need; one or two usually leave more room for real life.</p><div class="dialog-footer"><button class="button primary" data-action="close-dialog">Sounds good</button></div>`);
  if(el.id==='settings-button'||el.id==='workspace-button')openSettings();
  if(el.id==='search-button')openSearch();
  if(el.id==='menu-toggle'){document.querySelector('#sidebar').classList.add('open');document.querySelector('#sidebar-scrim').hidden=false;}
  if(el.id==='sidebar-scrim')closeSidebar();
  if(el.id==='undo-button'&&undoAction){const action=undoAction;undoAction=null;action();document.querySelector('#toast').classList.remove('visible');}
});
document.addEventListener('submit',event=>{
  const form=event.target;if(!['quick-add-form','task-form','plan-form','capacity-form','world-form','remove-world-form'].includes(form.id))return;
  event.preventDefault();const data=new FormData(form);
  if(form.id==='world-form'){
    try {
      const values={name:String(data.get('name')),description:String(data.get('description')),color:String(data.get('color')),icon:String(data.get('icon'))};
      if(form.dataset.id)updateWorld(state,form.dataset.id,values);else addWorld(state,values);
      save();render();openWorldManager();showToast('Your worlds, updated.');
    }catch(error){const message=document.querySelector('#world-form-error');message.textContent=error.message;message.hidden=false;}
  }
  if(form.id==='remove-world-form'){
    try {removeWorldAndKeepContents(form.dataset.id,String(data.get('replacementId')));}
    catch(error){const message=document.querySelector('#world-form-error');message.textContent=error.message;message.hidden=false;}
  }
  if(form.id==='quick-add-form'){
    const title=String(data.get('title')).trim();if(!title)return;
    const context=defaultContext();state.tasks.push({id:uid(),title,...context,deadline:'',duration:0,focus:false,notes:'',completedAt:'',createdAt:new Date().toISOString(),sample:false});save();render();showToast(context.date?'A small next step, added.':'Captured in Inbox. Decide when later.');document.querySelector('#quick-add-form input')?.focus();
  }
  if(form.id==='task-form'){
    const existing=state.tasks.find(t=>t.id===form.dataset.id);const title=String(data.get('title')).trim();if(!title){form.elements.title.setCustomValidity('Give this task a few words.');form.elements.title.reportValidity();return;}
    const date=String(data.get('date'));const deadline=String(data.get('deadline'));if((date&&!isDate(date))||(deadline&&!isDate(deadline)))return;
    const task={id:existing?.id??uid(),title,area:String(data.get('area')),planId:String(data.get('planId')),date,deadline,duration:Number(data.get('duration')),focus:data.get('focus')==='on',notes:String(data.get('notes')),createdAt:existing?.createdAt??new Date().toISOString(),completedAt:existing?.completedAt??'',sample:false};
    if(existing)Object.assign(existing,task);else state.tasks.push(task);save();dialog.close();render();showToast(existing?'A little clearer. Changes saved.':'Your next step is on the list.');
  }
  if(form.id==='plan-form'){
    const existing=state.plans.find(p=>p.id===form.dataset.id);const title=String(data.get('title')).trim();if(!title){form.elements.title.setCustomValidity('Give this plan a name.');form.elements.title.reportValidity();return;}
    const targetDate=String(data.get('targetDate'));if(targetDate&&!isDate(targetDate))return;
    const plan={id:existing?.id??uid(),title,outcome:String(data.get('outcome')),area:String(data.get('area')),targetDate,status:String(data.get('status')),sample:false};
    if(existing)Object.assign(existing,plan);else state.plans.push(plan);save();dialog.close();if(route===`plan:${plan.id}`)render();else go(`plan:${plan.id}`);showToast(existing?'Plan updated.':'A direction to grow toward.');
  }
  if(form.id==='capacity-form'){state.settings.capacity=Number(data.get('capacity'));save();dialog.close();render();showToast('A little more realistic. Capacity updated.');}
});
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.name==='title')el.setCustomValidity('');
  if(el.id==='daily-reflection'){
    const selected=route.startsWith('day:')?route.slice(4):dateKey();state.reflections[selected]=el.value;const success=save();document.querySelector('#reflection-status').textContent=success?'Saved in Notes':'Export to keep';
  }
  if(el.id==='note-title'||el.id==='note-body'){
    const note=state.notes.find(n=>n.id===selectedNote);if(!note)return;
    if(el.id==='note-title')note.title=el.value.trim()||'Untitled thought';else note.body=el.value;
    note.updatedAt=new Date().toISOString();note.sample=false;
    const saved=save();document.querySelector('#note-save-status').innerHTML=`${icon(saved?'check':'info')}${saved?' Saved on this device':' Export to keep changes'}`;
    document.querySelector('#note-word-count').textContent=`${wordCount(note.body)} words`;
    clearTimeout(noteSaveTimeout);noteSaveTimeout=setTimeout(updateNoteList,300);
  }
  if(el.id==='global-search')updateSearch(el.value);
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='sort-select'){sort=el.value;render();}
  if(el.id==='task-area'){document.querySelector('#task-plan').innerHTML=planOptions('',el.value);}
  if(el.id==='note-area'||el.id==='note-plan'){
    const note=state.notes.find(n=>n.id===selectedNote);if(!note)return;
    if(el.id==='note-area'){note.area=el.value;if(state.plans.find(p=>p.id===note.planId)?.area!==note.area)note.planId='';document.querySelector('#note-plan').innerHTML=planOptions(note.planId,note.area);}else note.planId=el.value;
    note.sample=false;note.updatedAt=new Date().toISOString();save();updateNoteList();
  }
  if(el.id==='import-file')importBackup(el.files[0]);
});
window.addEventListener('hashchange',()=>{route=readRoute();filter='all';render();closeSidebar();window.scrollTo({top:0});});
window.addEventListener('storage',event=>{
  if(event.key!==STORAGE_KEY)return;
  if(event.newValue===null){storageIssue='Saved data was cleared in another tab. Export this tab’s data to keep a copy.';persistenceBlocked=true;render();return;}
  // Keep an in-progress note intact instead of silently replacing it with another tab’s edits.
  storageIssue='Daybook changed in another tab. Export this tab if it has unsaved work, then reload to use the latest copy.';persistenceBlocked=true;render();
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&refreshDay!==dateKey()){refreshDay=dateKey();if(!dialog.open)render();}});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeSidebar();
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||dialog.open)return;
  if(event.key==='/'){event.preventDefault();openSearch();}
  if(event.key.toLowerCase()==='n'&&!event.metaKey&&!event.ctrlKey){event.preventDefault();openTask();}
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
hydrateIcons();
if(!persistenceBlocked)save();
render();
