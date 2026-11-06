import {it,expect} from "vitest";
import {createLoad,createProject} from "../src/domain/project";
import {compareScenarioPeriod} from "../src/engine/comparison";
it("compares actual elapsed energy and physical imports without inventing missing start, carbon or feeder evidence",()=>{
 const project=createProject("Baseline");project.loads=[createLoad({rating:1,hoursPerDay:24,startHour:0,pf:1})];project.coincidence=1;project.growthPercent=0;project.tariff={...project.tariff,importRate:0.3,standingPerDay:0,demandPerKW:0,taxPercent:0};
 const current=structuredClone(project);current.loads[0].rating=2;const options={start:"2026-01-01T00:00:00Z",end:"2026-01-02T00:00:00Z"};
 const a=compareScenarioPeriod(project,options),b=compareScenarioPeriod(current,options);
 expect(a.values.loadKWh).toBeCloseTo(24);expect(b.values.importKWh).toBeCloseTo(48);expect(a.values.totalCost).toBeCloseTo(7.2);expect(b.values.totalCost).toBeCloseTo(14.4);
 expect(b.values.startPeakKVA).toBeNull();expect(b.values.feederLossW).toBeNull();expect(b.values.carbonKg).toBeNull();expect(project.loads[0].rating).toBe(1);
 expect(()=>compareScenarioPeriod(project,{...options,end:"2026-03-01T00:00:00Z"})).toThrow(/31/);
});
