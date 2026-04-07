import uuid
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

# Recursive data type
@dataclass
class CoqType:
    name: str
    args: List['CoqType'] = field(default_factory=list) # Forward Reference with '', COQType is not yet defined

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "args": [arg.to_dict() for arg in self.args]
        }

# Constructor argument
@dataclass
class ConstructorArg:
    type: CoqType
    names: List[str] = field(default_factory=list) # Variable names, only for Binder style

    def to_dict(self) -> Dict[str, Any]:
        return {
            "names": self.names,
            "type": self.type.to_dict()
        }

# Constructor
@dataclass
class CoqConstructor:
    name: str
    args: List[ConstructorArg] = field(default_factory=list)
    syntax_style: str = ""  # "binder" (parentheses) or "arrow"
    return_type: Optional[CoqType] = None # For arrow notation (e.g. ... -> list nat)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "name": self.name,
            "syntaxStyle": self.syntax_style,
            "args": [arg.to_dict() for arg in self.args]
        }
        
        # Include returnType only if it exists
        if self.return_type:
            data["returnType"] = self.return_type.to_dict()
        return data

# Data type
@dataclass
class CoqInductiveType:
    name: str
    constructors: List[CoqConstructor]
    type_parameters: List[str] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sort: str = "clasic"    # "clasic" |  "atomic"
    color: str = "rgb(151, 151, 151)"
    full_text: str = ""      # Full original text of the inductive type

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "sort": self.sort,
            "color": self.color,
            "name": self.name,
            "typeParameters": self.type_parameters,
            "constructors": [c.to_dict() for c in self.constructors],
            "fullText": self.full_text
        }
