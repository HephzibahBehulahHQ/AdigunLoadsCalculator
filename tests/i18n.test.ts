import { describe, expect, it } from 'vitest';
import { hasTranslation, languages, numberFormat, translate } from '../src/i18n';
import type { Locale } from '../src/i18n';
import { tools } from '../src/tools';

const secondary:Locale[]=['de','yo','pcm'];
describe('four-language core and tool navigation',()=>{
  it('exposes the four required language names',()=>{expect(languages).toEqual({en:'English',de:'Deutsch',yo:'Yorùbá',pcm:'Nigerian Pidgin'});});
  it('has real dictionary entries for all 51 toolbox titles and every category',()=>{
    expect(tools).toHaveLength(51);
    const missing=tools.flatMap(tool=>secondary.flatMap(locale=>[tool.title,tool.category].filter(key=>!hasTranslation(key,locale)).map(key=>`${locale}: ${key}`)));
    expect(missing).toEqual([]);
  });
  it('translates high-frequency electrical fields and consequential state labels',()=>{
    const keys=['Voltage','Current','Power','Resistance','Displacement power factor','Energy duty','On-state current','On-state conductor current','Shaft output','Motor starting current','One-way route length','Required disconnection time','Initial stored energy','Stored-to-AC discharge efficiency','Actual elapsed charging window','incomplete','unsupported','passed','failed'];
    expect(keys.flatMap(key=>secondary.filter(locale=>!hasTranslation(key,locale)).map(locale=>`${locale}: ${key}`))).toEqual([]);
  });
  it('translates new workspace and energy controls',()=>{
    const keys=['History','Charging strategy','Time-of-use bands','Simulate grid outage','Outage duration','Conversion losses','Energy balance error','Open navigation','Collapse navigation','Phase pair','Timeline hour','Zoom in','Zoom out'];
    expect(keys.flatMap(key=>secondary.filter(locale=>!hasTranslation(key,locale)).map(locale=>`${locale}: ${key}`))).toEqual([]);
  });
  it('retains Unicode labels and uses locale-aware numeric formatting',()=>{
    expect(translate('Open project','yo')).toBe('Ṣí iṣẹ́');expect(translate('Add load','de')).toBe('Last hinzufügen');expect(numberFormat(1234.5,1,'de')).toBe('1.234,5');expect(numberFormat(1234.5,1,'en')).toBe('1,234.5');
  });
  it('keeps unreviewed technical strings visible rather than inventing a translation',()=>{expect(hasTranslation('Unreviewed technical phrase','de')).toBe(false);expect(translate('Unreviewed technical phrase','de')).toBe('Unreviewed technical phrase');});
});
