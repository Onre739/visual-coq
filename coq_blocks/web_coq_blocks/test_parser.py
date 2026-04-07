import unittest
from antlr.COQMain import process_coq_code

class TestParser(unittest.TestCase):
    def test_simple_inductive(self):
        src = "Inductive nat : Type := | O | S : nat -> nat."
        out = process_coq_code(src)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0].name, "nat")
        self.assertEqual(len(out[0].constructors), 2)

    def test_polymorphic_list(self):
        src = "Inductive list (A : Type) : Type := | nil : list A | cons : A -> list A -> list A."
        out = process_coq_code(src)
        self.assertEqual(out[0].name, "list")
        self.assertEqual(out[0].type_parameters, ["A"])
        self.assertEqual(len(out[0].constructors), 2)

    def test_empty_input(self):
        # Expect an exception to be raised for empty input
        with self.assertRaises(Exception):
            process_coq_code("")

    def test_multiple_definitions(self):
        # More definitions in one input
        src = """
        Inductive bool : Type := | true | false.
        Inductive nat : Type := | O | S : nat -> nat.
        """
        out = process_coq_code(src)
        self.assertEqual(len(out), 2)
        self.assertEqual(out[0].name, "bool")
        self.assertEqual(out[1].name, "nat")

    def test_empty_type(self):
        # Expect an exception for an inductive type with no constructors
        src = "Inductive empty : Type := ."
        with self.assertRaises(Exception):
            process_coq_code(src)

    def test_invalid_syntax(self):
        # Expect an exception for invalid Coq syntax
        src = "Inductive spatny_zapis -> | : Type"
        with self.assertRaises(Exception):
            process_coq_code(src)

    def test_apostrophe_name(self):
        src = "Inductive list' : Type := | cons' : list'."
        out = process_coq_code(src)
        self.assertEqual(out[0].name, "list'")
        self.assertEqual(out[0].constructors[0].name, "cons'")

    # =========================================================================
    # Positive test  (Advanced features and edge cases)
    # =========================================================================

    def test_enum_type(self):
        src = "Inductive color : Type := | red | green | blue."
        out = process_coq_code(src)
        self.assertEqual(out[0].name, "color")
        self.assertEqual(len(out[0].constructors), 3)

    def test_implicit_parameters(self):
        src = "Inductive option {X : Type} : Type := | some (x : X) | none."
        out = process_coq_code(src)
        self.assertEqual(out[0].name, "option")
        self.assertEqual(out[0].type_parameters, ["X"]) 

    def test_multiple_arrows(self):
        src = "Inductive btree (A : Type) : Type := | leaf : btree A | node : A -> btree A -> btree A -> btree A."
        out = process_coq_code(src)
        self.assertEqual(out[0].name, "btree")
        self.assertEqual(len(out[0].constructors), 2)
        
    def test_edge_case_names(self):
        src = "Inductive crazy_list' (A_type : Type) : Type := | empty_list : crazy_list' A_type | cons_item' (head' : A_type) (tail_ : crazy_list' A_type)."
        out = process_coq_code(src)
        self.assertEqual(out[0].name, "crazy_list'")
        self.assertEqual(out[0].type_parameters, ["A_type"])

    # =========================================================================
    # Negative tests (Semantic and lexical checks)
    # =========================================================================

    def test_incomplete_return_type(self):
        src = "Inductive tree (X : Type) : Type := | leaf : tree X | node : X -> tree X -> tree."
        with self.assertRaises(ValueError):
            process_coq_code(src)

    def test_mismatched_return_type_params(self):
        src = "Inductive box (A : Type) : Type := | empty_box : box A | fill_box : A -> box B."
        with self.assertRaises(ValueError):
            process_coq_code(src)

    def test_wrong_return_type(self):
        src = "Inductive my_list (X : Type) : Type := | my_nil : my_list X | my_cons : X -> my_list X -> list X."
        with self.assertRaises(ValueError):
            process_coq_code(src)

    def test_duplicate_type_parameters(self):
        src = "Inductive pair (X X : Type) : Type := | mkpair : X -> X -> pair X X."
        with self.assertRaises(ValueError):
            process_coq_code(src)

    def test_duplicate_constructor_names(self):
        src = "Inductive direction : Type := | left : direction | right : direction | left : direction."
        with self.assertRaises(ValueError):
            process_coq_code(src)

    def test_reserved_words(self):
        with self.assertRaises(ValueError):
            process_coq_code("Inductive match : Type := | foo : match.")
            
        with self.assertRaises(ValueError):
            process_coq_code("Inductive test (forall : Type) : Type := | return : test forall.")

    def test_illegal_characters(self):
        src = "Inductive list@ (X : Type) : Type := | nil# : list@ X."
        with self.assertRaises(ValueError):
            process_coq_code(src)

    def test_higher_order_function_unsupported(self):
        src = """
        Inductive expr : Type := 
          | apply (f : expr -> expr) (e : expr).
        """
        with self.assertRaises(ValueError):
            process_coq_code(src)

if __name__ == "__main__":
    unittest.main()