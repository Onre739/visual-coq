import sys
from antlr4 import *
from .COQLexer import COQLexer
from .COQParser import COQParser
from .MyVisitor import MyVisitor

from antlr4.error.ErrorListener import ErrorListener

def process_coq_code(string):
    if not string or string.strip() == "":
        raise ValueError("Empty input data")

    input_stream = InputStream(string)
    
    error_listener = CollectingErrorListener()

    lexer = COQLexer(input_stream)
    lexer.removeErrorListeners()
    lexer.addErrorListener(error_listener)
    
    stream = CommonTokenStream(lexer)

    parser = COQParser(stream)
    parser.removeErrorListeners()
    parser.addErrorListener(error_listener)

    tree = parser.prog()

    if error_listener.errors:
        raise ValueError("Syntax error: " + " | ".join(error_listener.errors))

    visitor = MyVisitor()
    return visitor.visit(tree)

class CollectingErrorListener(ErrorListener):
    def __init__(self):
        self.errors = []

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        self.errors.append(f"Line {line}:{column} - {msg}")

