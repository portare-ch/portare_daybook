import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSeed, validateState, isTodayTask, taskMatches, shiftDate, weekDates, planProgress, isDate, addWorld, updateWorld, moveWorld, removeWorld, defaultWorldId, worldById, clearSampleContent } from '../dist/model.js';

const today='2026-10-20';
const task=(extra={})=>({...makeSeed(today).tasks[0],...extra});

test('unfinished work stays visible after its planned day, while completed work leaves Today',()=>{
  assert.equal(isTodayTask(task({date:'2026-10-19'}),today),true);
  assert.equal(isTodayTask(task({date:'2026-10-19',completedAt:'2026-10-19T12:00:00Z'}),today),false);
  assert.equal(isTodayTask(task({date:'2026-10-21'}),today),false);
});
test('a deadline brings an unscheduled or future-planned task into Today',()=>{
  assert.equal(isTodayTask(task({date:'',deadline:today}),today),true);
  assert.equal(isTodayTask(task({date:'2026-10-25',deadline:'2026-10-19'}),today),true);
  assert.equal(isTodayTask(task({date:'',deadline:''}),today),false);
});
test('Inbox retains unscheduled tasks and Upcoming includes future deadlines',()=>{
  const item=task({date:'',deadline:'2026-10-22'});
  assert.equal(taskMatches(item,'inbox',today),true);
  assert.equal(taskMatches(item,'upcoming',today),true);
  assert.equal(taskMatches({...item,completedAt:'2026-10-20T12:00:00Z'},'inbox',today),false);
});
test('calendar calculations handle month boundaries, leap years and a Sunday week',()=>{
  assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
  assert.equal(shiftDate('2028-02-28',1),'2028-02-29');
  assert.deepEqual(weekDates('2026-10-25'),['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25']);
  assert.equal(isDate('2026-02-30'),false);
});
test('backup roundtrip keeps tasks, notes, plans and dated reflections independently',()=>{
  const original=makeSeed(today);original.reflections[today]='Remember this thought.';
  const restored=validateState(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(restored,original);
  restored.notes[0].body='Changed';
  assert.notEqual(restored.notes[0].body,original.notes[0].body);
});
test('restore rejects corrupt, ambiguous and orphaned data before it can replace current work',()=>{
  for(const change of [
    s=>{s.version=99;},
    s=>{s.tasks[0].id=s.notes[0].id;},
    s=>{s.tasks[0].planId='missing-plan';},
    s=>{s.tasks[0].duration=-1;},
    s=>{s.tasks[0].deadline='2026-02-30';},
    s=>{s.notes[0].body=null;},
    s=>{s.plans[0].status='unknown';},
    s=>{s.reflections={bad:'Invalid date'};},
    s=>{s.settings.capacity=0;}
  ]) {const data=makeSeed(today);change(data);assert.throws(()=>validateState(data));}
});
test('plan progress stays attached to its own steps',()=>{
  const data=makeSeed(today);
  const other=data.tasks.find(t=>t.planId==='p2');other.completedAt='2026-10-20T12:00:00Z';
  assert.deepEqual(planProgress('p4',data.tasks),{total:2,done:0,percent:0});
  data.tasks.find(t=>t.planId==='p4').completedAt='2026-10-20T12:00:00Z';
  assert.deepEqual(planProgress('p4',data.tasks),{total:2,done:1,percent:50});
  assert.deepEqual(planProgress('empty',data.tasks),{total:0,done:0,percent:0});
});

test('custom world names, colors, order and content survive a backup roundtrip',()=>{
  const data=makeSeed(today);
  const world=addWorld(data,{name:' Study ',color:'#375C9A',icon:'notes',description:'Long-term learning.'});
  const personal=data.worlds.find(w=>w.id==='personal');
  updateWorld(data,personal.id,{...personal,name:'Home & family'});
  moveWorld(data,world.id,-1);
  data.tasks.push(task({id:'custom-task',area:world.id,sample:false}));
  data.notes.push({...data.notes[0],id:'custom-note',area:world.id,planId:'',sample:false});
  const restored=validateState(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(restored,data);
  assert.equal(worldById(restored,world.id).name,'Study');
  assert.equal(worldById(restored,world.id).color,'#375c9a');
  assert.equal(restored.worlds.at(-2).id,world.id);
  assert.equal(worldById(restored,personal.id).name,'Home & family');
});
test('removing a world moves its tasks, plans and notes without breaking links',()=>{
  const data=makeSeed(today);
  const own=addWorld(data,{name:'Learning',color:'#375c9a',icon:'notes',description:''});
  const linkedBefore=data.tasks.find(t=>t.planId==='p2');
  const noteBefore=data.notes.find(n=>n.planId==='p2');
  removeWorld(data,'portareos',own.id);
  assert.equal(data.plans.find(p=>p.id==='p2').area,own.id);
  assert.equal(linkedBefore.area,own.id);
  assert.equal(linkedBefore.planId,'p2');
  assert.equal(noteBefore.area,own.id);
  assert.equal(noteBefore.planId,'p2');
  assert.equal(data.worlds.some(w=>w.id==='portareos'),false);
  assert.doesNotThrow(()=>validateState(data));
});
test('the default world remains usable after renaming and removing starter worlds',()=>{
  const data=makeSeed(today);
  removeWorld(data,'personal','portare');
  assert.equal(defaultWorldId(data),'portare');
  const world=data.worlds[0];updateWorld(data,world.id,{...world,name:'My own world'});
  assert.equal(defaultWorldId(data),world.id);
  for(const other of [...data.worlds].slice(1))removeWorld(data,other.id,world.id);
  assert.throws(()=>removeWorld(data,world.id,world.id),/at least one/);
  assert.doesNotThrow(()=>validateState(data));
});
test('invalid world changes leave the existing data intact',()=>{
  const data=makeSeed(today);const before=structuredClone(data);
  assert.throws(()=>addWorld(data,{name:'personal',color:'#ffffff',icon:'leaf',description:''}),/already exists/);
  assert.throws(()=>updateWorld(data,'personal',{name:'',color:'#ffffff',icon:'leaf'}));
  assert.throws(()=>addWorld(data,{name:'Study',color:'red;display:none',icon:'leaf'}));
  assert.throws(()=>removeWorld(data,'personal','missing'));
  assert.deepEqual(data,before);
});
test('restore rejects unsafe world definitions and missing world references',()=>{
  for(const change of [
    s=>{s.worlds=[];},
    s=>{s.worlds[1].id=s.worlds[0].id;},
    s=>{s.worlds[1].name=s.worlds[0].name.toUpperCase();},
    s=>{s.worlds[0].color='red;background:url(example)';},
    s=>{s.worlds[0].tint='" onclick="alert(1)';},
    s=>{s.worlds[0].icon='unknown';},
    s=>{s.tasks[0].area='missing';}
  ]){const data=makeSeed(today);change(data);assert.throws(()=>validateState(data));}
});
test('older backups retire obsolete examples while preserving personal records and reflections',()=>{
  const data=makeSeed(today);data.version=1;delete data.worlds;
  data.tasks.push(task({id:'retired-sample-task',area:'retired',sample:true,planId:'retired-plan'}));
  data.tasks.push(task({id:'my-task',area:'retired',sample:false,planId:'retired-plan'}));
  data.plans.push({...data.plans[0],id:'retired-plan',area:'retired',sample:true});
  data.notes.push({...data.notes[0],id:'my-note',area:'retired',planId:'retired-plan',body:'My own content.',sample:false});
  data.reflections[today]='A thought I want to keep.';
  const restored=validateState(data);
  assert.equal(restored.version,2);
  assert.equal(restored.tasks.some(t=>t.id==='retired-sample-task'),false);
  assert.equal(restored.plans.some(p=>p.id==='retired-plan'),false);
  assert.equal(restored.tasks.find(t=>t.id==='my-task').area,defaultWorldId(restored));
  assert.equal(restored.tasks.find(t=>t.id==='my-task').planId,'');
  assert.equal(restored.notes.find(n=>n.id==='my-note').body,'My own content.');
  assert.equal(restored.reflections[today],data.reflections[today]);
  assert.equal(data.version,1);
});
test('start fresh keeps custom worlds and user work, including referenced sample plans',()=>{
  const data=makeSeed(today);
  const world=addWorld(data,{name:'Study',color:'#375c9a',icon:'notes',description:''});
  const saved=data.tasks.find(t=>t.planId==='p2');saved.sample=false;
  data.notes[0].sample=false;data.notes[0].body='An edited thought.';
  data.reflections[today]='A daily note.';
  const cleared=clearSampleContent(data);
  assert.equal(cleared.tasks.length,1);
  assert.equal(cleared.tasks[0].id,saved.id);
  assert.equal(cleared.notes[0].body,'An edited thought.');
  assert.equal(cleared.plans.some(p=>p.id==='p2'),true);
  assert.equal(cleared.plans.some(p=>p.id==='p4'),true);
  assert.equal(cleared.plans.some(p=>p.id==='p3'),false);
  assert.equal(cleared.worlds.some(w=>w.id===world.id),true);
  assert.equal(cleared.reflections[today],'A daily note.');
  assert.equal(cleared.settings.sampleNotice,false);
  assert.ok(data.tasks.length>cleared.tasks.length);
  assert.doesNotThrow(()=>validateState(cleared));
});
