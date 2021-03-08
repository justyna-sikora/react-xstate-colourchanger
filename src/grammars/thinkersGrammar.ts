

export const grammar = `
<grammar root="quote_short">
    <rule id="quote_short">
    </rule>
    <rule id="author">
          <one-of>
             <item>to do is to be<tag>out="Socrates";</tag></item>
             <item>to be is to do<tag>out="Sartre";</tag></item>
             <item>do be do be do<tag>out="Sinatra";</tag></item>
          </one-of>
    </rule>
    <rule id="quote_short">
       <ruleref uri="#author"/>
       <tag>out.author=rules.author</tag>
    </rule>
 
 </grammar>
 `

