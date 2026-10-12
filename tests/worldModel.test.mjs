import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera } from 'three'
import { OrbitControls } from 'three-stdlib'
import { assignedRecords, assignedTo, buildingKind, cameraZoom, filterRecords, mergeRecords, permitted, placementsFor, recordKey, roleOf, sceneSample, teamDepartments, territoryOf, workspaceRecords } from '../src/crm/worldModel.js'

test('missing geography and workflow state never invent a territory', () => {
  assert.equal(territoryOf({ state_name: 'New South Wales', name: 'NSW customer', summary: 'Sydney' }), 'UNASSIGNED')
  assert.equal(territoryOf({ state: 'Closed' }), 'UNASSIGNED')
  assert.equal(territoryOf({ state_code: 'nsw' }), 'NSW')
  assert.equal(territoryOf({ address: { state: 'Western Australia' } }), 'WA')
})

test('only explicit staff roles choose hierarchy architecture', () => {
  assert.equal(buildingKind({ type: 'Employee', name: 'Manager Bob' }), 'house')
  assert.equal(buildingKind({ type: 'Employee', role: 'Area Head' }), 'leader')
  assert.equal(buildingKind({ type: 'Employee', designation: 'Member' }), 'house')
  assert.equal(buildingKind({ type: 'Customer' }), 'company')
  assert.equal(buildingKind({ type: 'Onboarding service' }), 'gateway')
})

test('client filtering never treats an admin-like ID as a permission bypass', () => {
  assert.equal(permitted({ department: 'support' }, { id: 'admin', modules: ['sales'] }), false)
  assert.equal(permitted({ department: 'teams' }, { modules: ['teams'] }), true)
  assert.equal(permitted({ department: 'customers' }, null), false)
})

test('actual designation is used, but staff names never invent a role', () => {
  assert.equal(roleOf({ type: 'Employee', summary: 'PHP developer' }), 'PHP developer')
  assert.equal(roleOf({ type: 'Employee', name: 'Super Admin' }), 'Role not supplied')
  assert.equal(buildingKind({ type: 'Employee', summary: 'Account Manager' }), 'leader')
})

test('personal work uses exact owner fields and rejects free-text mentions', () => {
  const person={id:'EMP-50',name:'Vignesh R'}
  assert.equal(assignedTo({type:'Lead',details:[['Owner','Vignesh R']]},person),true)
  assert.equal(assignedTo({type:'Lead',owner_id:50},person),true)
  assert.equal(assignedTo({type:'Lead',details:[['Created by','Vignesh R']]},person),false)
  assert.equal(assignedTo({type:'Lead',summary:'Vignesh R',name:'Vignesh R'},person),false)
  assert.equal(workspaceRecords([{id:'EMP-50',type:'Employee'},{id:'EMP-51',type:'Employee'}],'mine',{id:50,name:'Vignesh R'}).length,1)
})

test('3D overview samples multiple actual record types, including people', () => {
  const records=[...Array.from({length:60},(_,i)=>({id:`C-${i}`,type:'Customer'})),{id:'EMP-1',type:'Employee'},{id:'T-1',type:'Service request'}]
  const sample=sceneSample(records,48)
  assert.equal(sample.length,48)
  assert.ok(sample.some(r=>r.type==='Employee'))
  assert.ok(sample.some(r=>r.type==='Service request'))
})

test('typed record keys avoid collisions and snapshots deduplicate staff', () => {
  const records = mergeRecords([{ id: 'EMP-1', type: 'Employee', status: 'Signed in' }], [{ id: 'EMP-1', type: 'Employee', name: 'Staff' }, { id: 'EMP-1', type: 'Team' }])
  assert.equal(records.length, 2)
  assert.equal(records[0].status, 'Signed in')
  assert.notEqual(recordKey(records[0]), recordKey(records[1]))
})

test('search combines query, module and actual geography', () => {
  const records = [{ id: 'Q-1', type: 'Quotation', department: 'quotes', state_code: 'NSW', details: [['Owner', 'Priya']] }, { id: 'Q-2', type: 'Quotation', department: 'quotes', state_code: 'WA', name: 'Priya' }]
  assert.deepEqual(filterRecords(records, { query: 'priya', module: 'quotes', territory: 'NSW' }).map(r => r.id), ['Q-1'])
  assert.equal(filterRecords(records, { module: 'contacts' }).length, 0)
})

test('unassigned positions wrap into bounded rows', () => {
  const records = Array.from({ length: 48 }, (_, i) => ({ id: String(i + 1), type: 'Lead' }))
  const positions = [...placementsFor(records).values()]
  assert.equal(new Set(positions.map(p => p.join(','))).size, 48)
  assert.ok(Math.max(...positions.map(p => p[0])) < 10)
  assert.ok(Math.max(...positions.map(p => p[2])) < 25)
})

test('zoom-in reduces camera distance in the actual installed controls', () => {
  const camera = new PerspectiveCamera()
  camera.position.set(55, 62, 68)
  const controls = new OrbitControls(camera)
  const before = camera.position.length()
  cameraZoom(controls, true)
  assert.ok(camera.position.length() < before)
  cameraZoom(controls, false)
  assert.ok(Math.abs(camera.position.length() - before) < .00001)
  controls.dispose()
})

test('duplicate staff names never imply a personal assignment',()=>{
  const records=[{id:'EMP-1',type:'Employee',name:'Alex'},{id:'EMP-2',type:'Employee',name:'Alex'},{id:'L1',type:'Lead',details:[['Owner','Alex']]},{id:'L2',type:'Lead',owner_id:1}];
  assert.deepEqual(assignedRecords(records,records[0]).map(r=>r.id),['L2']);
  assert.equal(assignedTo({type:'Lead',owner_id:2,details:[['Owner','Alex']]},records[0]),false);
});


test('department navigation uses explicit team departments without inferring staff membership', () => {
  const records = [
    {id:'t1',type:'Team',name:'Web',details:[['Department','Delivery']]},
    {id:'t2',type:'Team',name:'Design',details:[['Department','delivery']]},
    {id:'p1',type:'Employee',name:'Delivery manager',department:'teams'},
    {id:'t3',type:'Team',name:'Sales',details:[['Department','—']]},
  ]
  const departments=teamDepartments(records)
  assert.equal(departments.length,1)
  assert.deepEqual(departments[0].records.map(r=>r.id),['t1','t2'])
})
