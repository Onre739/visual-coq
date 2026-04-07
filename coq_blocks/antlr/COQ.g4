grammar COQ;

prog: inductiveDef+ EOF;
         
inductiveDef: 'Inductive' NAME typeParameters* (':' 'Type')? ':=' 
              constructor+ '.';

typeParameters: '(' NAME+ ':' 'Type' ')'
              | '{' NAME+ ':' 'Type' '}'
              ;

constructor: ('|')? NAME ':' arrowParam* type_expression    # ArrowEntry
           | ('|')? NAME binderParam*                       # BinderEntry
           ;

arrowParam: type_expression '->';
binderParam: '(' NAME+ ':' type_expression ')'; 

type_expression: type_term+;
type_term: NAME                    # TypeTermName      
         | '(' type_expression ')' # TypeTermParens    
    ;

NAME: [a-zA-Z_][a-zA-Z0-9_']* ;
WS: [ \t\r\n]+ -> skip;