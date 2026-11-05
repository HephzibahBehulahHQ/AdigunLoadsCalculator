import { describe, expect, it } from 'vitest';
import { billCsv, calculateBill, decimalInteger, parseBillJson, safeCsvCell, validateBill } from '../src/import-export/reports';
import type { BillDocument } from '../src/import-export/reports';

const valid=():BillDocument=>({schemaVersion:1,projectName:'Analytical billing fixture',currency:'EUR',locale:'en',kind:'estimate',number:'TEST-001',date:'2026-11-05',dueDate:'2026-12-05',seller:'Test supplier',sellerTaxId:'',customer:'Test customer',customerReference:'',notes:'Verification fixture; not a customer record.',paymentDetails:'',discountPercent:'0',taxPercent:'0',lines:[{id:'test-line',description:'Test item',category:'material',quantity:'1',unitPrice:'10.00'}]});

describe('decimal-safe customer billing',()=>{
  it('adds 0.10 and 0.20 without binary decimal drift',()=>{
    const bill=valid();bill.lines=[{id:'1',description:'A',category:'material',quantity:'1',unitPrice:'0.10'},{id:'2',description:'B',category:'labour',quantity:'1',unitPrice:'0.20'}];
    expect(calculateBill(bill).totalMinor).toBe(30);
  });
  it('rounds fractional line quantities first, then discount, then tax',()=>{
    const bill=valid();bill.lines[0].quantity='2.5';bill.lines[0].unitPrice='19.99';bill.discountPercent='10';bill.taxPercent='19';
    // 2.5 × 19.99 = 49.975 -> 49.98; discount 4.998 -> 5.00;
    // net 44.98; tax 8.5462 -> 8.55; total 53.53.
    expect(calculateBill(bill)).toMatchObject({lineMinor:[4998],subtotalMinor:4998,discountMinor:500,netMinor:4498,taxMinor:855,totalMinor:5353});
  });
  it('handles zero-decimal JPY and three-decimal KWD correctly',()=>{
    const bill=valid();bill.currency='JPY';bill.lines[0].unitPrice='101';bill.lines[0].quantity='1.5';expect(calculateBill(bill).totalMinor).toBe(152);
    bill.currency='KWD';bill.lines[0].unitPrice='1.123';bill.lines[0].quantity='2';expect(calculateBill(bill).totalMinor).toBe(2246);
  });
  it('rejects excess precision, negative values and non-finite input',()=>{
    expect(()=>decimalInteger('1.001',2)).toThrow('decimal places');expect(()=>decimalInteger('-1',2)).toThrow();expect(()=>decimalInteger('NaN',2)).toThrow();expect(()=>decimalInteger('Infinity',2)).toThrow();
    const bill=valid();bill.lines[0].quantity='0';expect(()=>calculateBill(bill)).toThrow('greater than zero');
    bill.lines[0].quantity='1';bill.discountPercent='100.01';expect(()=>calculateBill(bill)).toThrow('0 and 100');
  });
  it('blocks invalid dates and missing customer details before issuing exports',()=>{
    const bill=valid();bill.date='2026-02-30';bill.seller='';bill.customer='';expect(validateBill(bill)).toContain('Enter a valid issue date.');expect(validateBill(bill)).toHaveLength(3);
    bill.date='2026-11-05';bill.dueDate='2026-11-01';expect(validateBill(bill)).toContain('Due / validity date must not precede the issue date.');
  });
  it('preserves draft strings, IDs and Unicode in backup round trips',()=>{
    const bill=valid();bill.projectName='Yorùbá — Ilé iṣẹ́';bill.lines[0].description='Àtùpà / Übergang';bill.lines[0].unitPrice='';
    expect(parseBillJson(JSON.stringify(bill))).toEqual(bill);
  });
  it('rejects malformed or foreign schema without changing the current document',()=>{
    const bill=valid();const before=structuredClone(bill);expect(()=>parseBillJson('{')).toThrow();expect(()=>parseBillJson(JSON.stringify({...bill,schemaVersion:2}))).toThrow();expect(bill).toEqual(before);
    expect(()=>parseBillJson(JSON.stringify({...bill,lines:[bill.lines[0],bill.lines[0]]}))).toThrow('ID');
  });
  it('neutralizes spreadsheet formula text but keeps numeric negatives',()=>{
    expect(safeCsvCell('=2+2')).toBe('"\'=2+2"');expect(safeCsvCell('  +SUM(A1)')).toBe('"\'  +SUM(A1)"');expect(safeCsvCell(-1.25)).toBe('-1.25');
    const bill=valid();bill.customer='@malicious';bill.lines[0].description='=HYPERLINK("https://example.invalid")';const csv=billCsv(bill);expect(csv).toContain('"\'@malicious"');expect(csv).toContain('"\'=HYPERLINK');expect(csv).toContain('10');
  });
  it('returns a valid zero total for an empty draft without calling it export-ready',()=>{
    const bill=valid();bill.lines=[];expect(calculateBill(bill).totalMinor).toBe(0);expect(validateBill(bill)).toContain('Add at least one priced line.');
  });
});
