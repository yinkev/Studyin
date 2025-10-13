import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export type Skill = { name: string; mastery: number; color?: 'primary'|'secondary'|'accent' };
export type Quest = { id: string; title: string; description?: string; done?: boolean };

export function RefinedSidebar({ currentView, onNavigate, userLevel, userXP, userName }:{ currentView:string; onNavigate:(v:any)=>void; userLevel:number; userXP:number; userName:string }){
  return (
    <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 border-r bg-white/80 backdrop-blur-xl p-4 hidden sm:block">
      <div className="text-xs text-muted-foreground">{userName}</div>
      <div className="text-sm">Level {userLevel}</div>
      <div className="mt-2 text-xs text-muted-foreground">XP {userXP}</div>
    </aside>
  );
}

export function LevelProgress({ level, masteryPercent }:{ level:number; masteryPercent:number }){
  return (
    <Card><CardContent className="p-4">
      <div className="text-sm text-muted-foreground">Level</div>
      <div className="text-3xl font-bold">{level}</div>
      <div className="h-2 w-full bg-neutral-200 rounded-full mt-2"><div className="h-2 bg-primary rounded-full" style={{width:`${Math.max(0,Math.min(100,masteryPercent))}%`}}/></div>
    </CardContent></Card>
  );
}

export function SkillGrid({ skills }:{ skills: Skill[] }){
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((s, i) => (
        <Card key={i}><CardContent className="p-4">
          <div className="text-sm font-semibold">{s.name}</div>
          <div className="h-2 bg-neutral-200 rounded-full mt-2"><div className="h-2 rounded-full" style={{width:`${s.mastery}%`, backgroundColor:'currentColor'}}/></div>
        </CardContent></Card>
      ))}
    </div>
  );
}

export function ActivityCalendar(){
  return <Card><CardContent className="p-4 text-sm text-muted-foreground">Activity calendar coming soon</CardContent></Card>;
}

export function QuickStats({ items }:{ items?: {label:string; value:string}[] }){
  const data = items || [];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {data.map((d,i)=>(<Card key={i}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{d.label}</div><div className="text-xl font-semibold">{d.value}</div></CardContent></Card>))}
    </div>
  );
}

export function KnowledgeGapsList({ gaps }:{ gaps?: Quest[] }){
  const list = gaps || [];
  return (
    <Card><CardContent className="p-0">
      <ul className="divide-y">
        {list.map((q)=> (
          <li key={q.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{q.title}</div>
              {q.description && <div className="text-xs text-muted-foreground">{q.description}</div>}
            </div>
            <span className="text-xs text-muted-foreground">{q.done? 'Done' : 'Pending'}</span>
          </li>
        ))}
      </ul>
    </CardContent></Card>
  );
}

