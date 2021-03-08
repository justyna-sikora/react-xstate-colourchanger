export const grammar = `
<grammar root="smarthome">

    <rule id="smarthome">
    <item repeat="0-1"> please </item>
        <ruleref uri="#todo"/>
            <tag> out.todo= rules.todo; </tag>
            </rule>
    
    <rule id="object1">
      <one-of>
         <item> light </item>
         <item> heat </item>
         <item> AC <tag> out = 'air conditioning'; </tag></item>
         <item> air conditioning </item>
      </one-of>
   
        <rule id="object2">
      <one-of>
         <item> window </item>
         <item> door </item>
      </one-of>
    </rule>

    <rule id="action1">
      <one-of>
         <item> close <tag> out = 'closed'; </tag> </item>
         <item> open <tag> out = 'opened'; </tag> </item>
      </one-of>
    </rule>


    <rule id="action2">
      <one-of>
         <item> turn on <tag> out = 'on'; </tag></item>
         <item> turn off  <tag> out = 'off'; </tag></item>
      </one-of>
    </rule>
    
    
<rule id="todo">
<one-of>

<item>
<one-of>
    <item> <ruleref uri="#action2"/> 
    <tag>out.action=rules.action2;</tag></item>
    <item> turn </item>
</one-of>
    <item repeat="0-1"> the </item>
    <ruleref uri="#object1"/>
    <tag>out.object=rules.object1;</tag>

    <item repeat="0-1"> on <tag>out.action="on";</tag> </item>
    <item repeat="0-1"> off <tag>out.action="off";</tag> </item> </item>

<item><one-of>
    <item> <ruleref uri="#action1"/> 
    <tag>out.action=rules.action1;</tag></item>
    <item> turn </item>
</one-of>
    <item repeat="0-1"> the </item>
    <ruleref uri="#object2"/>
    <tag>out.object=rules.object2;</tag>
</item></one-of>

    </rule>
    </grammar>  
    `