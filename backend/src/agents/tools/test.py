import asyncio
import os
import shutil
import time
from lightrag_tool import LightRAGTool, LightRAGToolConfig

TEST_WORKING_DIR = "./test"
if os.path.exists(TEST_WORKING_DIR):
    # Remove all contents within the directory
    for filename in os.listdir(TEST_WORKING_DIR):
        file_path = os.path.join(TEST_WORKING_DIR, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)  # Remove file or link
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)  # Remove directory
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')
else:
    os.makedirs(TEST_WORKING_DIR)
async def run_tests():
    """Runs a sequence of tests on the LightRAGTool."""

    print("--- Test Suite Starting ---")
    print(f"Using Test Workspace: {TEST_WORKING_DIR}")
    print("\n--- 1. Setup Tool ---")
    config = LightRAGToolConfig(working_dir=TEST_WORKING_DIR)
    tool: LightRAGTool | None = None
    initialization_success = False
    try:
        tool = LightRAGTool(config=config)
        init_result = await tool.initialize()
        print(f"Tool Initialization Result: {init_result}")
        if "Error" in init_result:
            print("!!! Initialization Failed. Aborting tests. !!!")
            return
        initialization_success = True

        print("\n--- 2. Store Text ---")
        doc1_text = "Langchain is a framework for developing applications powered by language models. It includes Agents and Chains."
        doc1_id = "doc_langchain_intro"
        doc2_text = "Agno is a Python framework for building conversational AI agents."
        doc3_text = "FAISS allows efficient similarity search on vectors."

        print(f"Storing Doc 1 (ID: {doc1_id})...")
        store_res1 = await tool.store_text(doc1_text, document_id=doc1_id, file_path="source1.txt")
        print(f"Store Result 1: {store_res1}")

        print("Storing Doc 2 (Auto ID)...")
        store_res2 = await tool.store_text(doc2_text, file_path="source2.txt")
        print(f"Store Result 2: {store_res2}")

        print("Storing Doc 3 (Auto ID)...")
        store_res3 = await tool.store_text(doc3_text, file_path="source3.txt")
        print(f"Store Result 3: {store_res3}")
        wait_time = 5
        print(f"\nWaiting {wait_time} seconds for potential background processing...")
        await asyncio.sleep(wait_time)

        print("\n--- 3. Check Document Status ---")
        status_result = await tool.get_doc_processing_status()
        print(f"Document Status Counts: {status_result}")
        print("\n--- 4. Test Retrieval ---")
        query1 = "What is Langchain used for?"
        print(f"\nQuery (Naive): '{query1}'")
        retrieve_res1_naive = await tool.retrieve_naive(query1, top_k=2)
        print(f"Naive Result:\n{retrieve_res1_naive}\n")

        query2 = "Frameworks for AI agents"
        print(f"Query (Mix KG+Vector): '{query2}'")
        retrieve_res2_mix = await tool.retrieve_mix_kg_vector(query2, top_k=3)
        print(f"Mix Result:\n{retrieve_res2_mix}\n")

        query3 = "Vector search libraries"
        print(f"Query (Hybrid): '{query3}'")
        retrieve_res3_hybrid = await tool.retrieve_hybrid(query3)
        print(f"Hybrid Result:\n{retrieve_res3_hybrid}\n")

        print("\n--- 5. Test KG Creation ---")
        entity_name = "LLM Application"
        print(f"Creating Entity: '{entity_name}'")
        create_ent_res = await tool.create_entity(entity_name, description="An application using Large Language Models", entity_type="Concept")
        print(f"Create Entity Result: {create_ent_res}")

        source_ent = "Langchain"
        target_ent = entity_name
        print(f"Creating Relation: '{source_ent}' -> '{target_ent}'")
        await tool.create_entity(source_ent, description="Framework for LLM apps", entity_type="Framework")
        create_rel_res = await tool.create_relation(source_ent, target_ent, description="is an example of", keywords="example_of", weight=0.8)
        print(f"Create Relation Result: {create_rel_res}")

        print("\n--- 6. Test KG Inspection ---")
        print(f"Getting Details for Entity: '{source_ent}'")
        details_ent_res = await tool.get_entity_details(source_ent)
        print(f"Entity Details:\n{details_ent_res}\n")

        print(f"Getting Details for Relation: '{source_ent}' -> '{target_ent}'")
        details_rel_res = await tool.get_relation_details(source_ent, target_ent)
        print(f"Relation Details:\n{details_rel_res}\n")

        print("\n--- 7. Test KG Editing ---")
        print(f"Editing Entity: '{source_ent}' (Adding more description)")
        edit_ent_res = await tool.edit_entity(source_ent, updates={"description": "A popular Python framework for LLM application development."})
        print(f"Edit Entity Result: {edit_ent_res}")
        details_ent_res_after = await tool.get_entity_details(source_ent)
        print(f"Entity Details After Edit:\n{details_ent_res_after}\n")

        print(f"Editing Relation: '{source_ent}' -> '{target_ent}' (Changing weight)")
        edit_rel_res = await tool.edit_relation(source_ent, target_ent, updates={"weight": 0.9})
        print(f"Edit Relation Result: {edit_rel_res}")
        details_rel_res_after = await tool.get_relation_details(source_ent, target_ent)
        print(f"Relation Details After Edit:\n{details_rel_res_after}\n")

        print("\n--- 8. Test KG Deletion ---")
        print(f"Deleting Relation: '{source_ent}' -> '{target_ent}'")
        delete_rel_res = await tool.delete_relation(source_ent, target_ent)
        print(f"Delete Relation Result: {delete_rel_res}")
        details_rel_res_deleted = await tool.get_relation_details(source_ent, target_ent)
        print(f"Relation Details After Delete Attempt:\n{details_rel_res_deleted}\n") # Should indicate not found

        print(f"Deleting Entity: '{target_ent}'")
        delete_ent_res = await tool.delete_entity(target_ent)
        print(f"Delete Entity Result: {delete_ent_res}")
        details_ent_res_deleted = await tool.get_entity_details(target_ent)
        print(f"Entity Details After Delete Attempt:\n{details_ent_res_deleted}\n") # Should indicate not found

        # --- Test Document Deletion ---
        print("\n--- 9. Test Document Deletion ---")
        print(f"Deleting Document: ID='{doc1_id}' ('{doc1_text[:30]}...')")
        delete_doc_res = await tool.delete_document(doc1_id)
        print(f"Delete Document Result: {delete_doc_res}")

        print(f"\nAttempting retrieval for content from deleted doc '{doc1_id}': 'Langchain Agents'")
        await asyncio.sleep(2)
        retrieve_after_delete = await tool.retrieve_naive("Langchain Agents")
        print(f"Naive Result After Delete:\n{retrieve_after_delete}\n")
        print("\n--- 10. Test Cache Clearing ---")
        print("Clearing 'naive' and 'mix' mode caches...")
        clear_cache_res = await tool.clear_llm_cache(modes=["naive", "mix"])
        print(f"Clear Cache Result: {clear_cache_res}")


    except Exception as e:
        print(f"\n--- !!! An Error Occurred During Tests !!! ---")
        import traceback
        traceback.print_exc()

    finally:
        # --- Finalize ---
        print("\n--- 11. Finalize Tool ---")
        if tool and initialization_success :
            finalize_result = await tool.finalize()
            print(f"Tool Finalization Result: {finalize_result}")
        else:
            print("Skipping finalization as tool was not initialized successfully.")

    print("\n--- Test Suite Finished ---")

if __name__ == "__main__":
    asyncio.run(run_tests())