export const grammar = `
<grammar root="app">

    <rule id="app">
    <item repeat="0-1"> Please </item>
        <ruleref uri="#todo"/>
            <tag>out.todo = new Object(); out.todo.action=rules.todo.action;
                 out.todo.object=rules.todo.object;</tag>
            </rule>
    
    <rule id="object">
      <one-of>
         <item> light </item>
         <item> heat </item>
         <item> A C <tag> out = 'air conditioning'; </tag></item>
         <item> air conditioning </item>
         <item> window </item>
         <item> door </item>
      </one-of>
    

    
    </rule>
    <rule id="action">
      <one-of>
         <item> turn on <tag> out = 'on'; </tag></item>
         <item> turn off <tag> out = 'off'; </tag> </item>
         <item> close <tag> out = 'off'; </tag> </item>
         <item> open <tag> out = 'on'; </tag> </item>
      </one-of>
    </rule>
    
    
    <rule id="todo">
    <ruleref uri="#action"/> 
    <tag>out.action=rules.action;</tag>
    <item repeat="0-1"> the </item>
    <ruleref uri="#object"/>
    <tag>out.object=rules.object;</tag>
    </rule>
    </grammar>   
`

export const grammar = `
<grammar root="app">

  <rule id="app">
      <item repeat="0-1"> Please </item>
      <ruleref uri="#action"/>
      <tag>out.action=rules.action;</tag>
      <item repeat="0-1"> the </item>
      <ruleref uri="#object"/>
      <tag>out.object=rules.object;</tag>
   </rule>

   <rule id="object">
     <one-of>
        <item> light </item>
        <item> heat </item>
        <item> A C <tag> out = 'air conditioning'; </tag></item>
        <item> air conditioning </item>
        <item> window </item>
        <item> door </item>
     </one-of>
   
   </rule>
   <rule id="action">
     <one-of>
        <item> turn on <tag> out = 'on'; </tag></item>
        <item> turn off <tag> out = 'off'; </tag> </item>
        <item> close <tag> out = 'off'; </tag> </item>
        <item> open <tag> out = 'on'; </tag> </item>
     </one-of>
   </rule>

   </grammar> 
   `