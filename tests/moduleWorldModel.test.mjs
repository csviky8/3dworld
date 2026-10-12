import test from 'node:test'
import assert from 'node:assert/strict'
import {moduleStatus,moduleGroups} from '../src/crm/moduleWorldModel.js'

test('contract statuses use explicit workflow values and keep unknown values separate',()=>{
  for(const [status,expected] of [['Active','active'],['Inactive','other'],['Expiring soon','expiring'],['Pending signature','pending'],['Renewal due','renewals'],['Completed','completed'],['','other']]){
    assert.equal(moduleStatus({status},'contracts'),expected)
  }
  assert.equal(moduleStatus({tone:'red',details:[['Expires','5 days']]},'contracts'),'other')
})
test('quotation acceptance is distinct from awaiting acceptance',()=>{
  for(const [status,expected] of [['Awaiting acceptance','pending'],['Accepted','accepted'],['Draft','draft'],['Rejected','declined'],['Expired','expired'],['Unknown','other']])assert.equal(moduleStatus({status},'quotes'),expected)
})
test('status groups account for every supplied record exactly once, including empty worlds',()=>{
  const records=[{status:'Active'},{status:'Expiring soon'},{status:'Renewal pending'},{status:null}]
  const groups=moduleGroups(records,'contracts')
  assert.equal(groups.reduce((sum,g)=>sum+g.count,0),records.length)
  assert.equal(groups.find(g=>g.id==='other').count,1)
  assert.ok(moduleGroups([],'quotes').every(g=>g.count===0))
})
