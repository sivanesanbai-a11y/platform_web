const fs = require('fs');
const filePath = 'C:/Users/NUNES/Desktop/NUNES_OPERATIONS_WORKSPACE/platform_web/src/components/ReportsClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `      <select value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="ALL">All statuses</option>
        {statuses.map(x=><option key={x} value={x}>{x}</option>)}
      </select>
      <select value={branch} onChange={e=>setBranch(e.target.value)}>
        <option value="ALL">All branches</option>
        {branches.map(x=><option key={x} value={x}>{x}</option>)}
      </select>
      <select value={employee} onChange={e=>setEmployee(e.target.value)}>
        <option value="ALL">All employees</option>
        {people.map(x=><option key={x} value={x}>{x}</option>)}
      </select>
      {source==="purchasing"&&<select value={market} onChange={e=>setMarket(e.target.value)}>
        <option value="ALL">IND + EXPORT</option>
        <option value="IND">IND</option>
        <option value="EXPORT">EXPORT</option>
      </select>}`;

const newBlock = `      <AnimatedSelect
        value={status}
        onValueChange={setStatus}
        options={statusOptions}
        placeholder="All statuses"
        triggerClassName="h-[34px] min-w-[130px] text-[11px]"
      />
      <AnimatedSelect
        value={branch}
        onValueChange={setBranch}
        options={branchOptions}
        placeholder="All branches"
        triggerClassName="h-[34px] min-w-[130px] text-[11px]"
      />
      <AnimatedSelect
        value={employee}
        onValueChange={setEmployee}
        options={employeeOptions}
        placeholder="All employees"
        triggerClassName="h-[34px] min-w-[135px] text-[11px]"
      />
      {source === "purchasing" && (
        <AnimatedSelect
          value={market}
          onValueChange={setMarket}
          options={marketOptions}
          placeholder="IND + EXPORT"
          triggerClassName="h-[34px] min-w-[130px] text-[11px]"
        />
      )}`;

const normC = content.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');
const normNew = newBlock.replace(/\r\n/g, '\n');

if (normC.includes(normOld)) {
  const result = normC.replace(normOld, normNew);
  fs.writeFileSync(filePath, result, 'utf8');
  console.log('REPLACED_SUCCESS');
} else {
  console.log('NOT_FOUND');
}
