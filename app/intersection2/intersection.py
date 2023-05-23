import sys
import pymeshlab as ml
import concurrent.futures
import time


# def main(argv):
#     #  file path from argv
#     [file1, file2, file2_result, file3, file3_result] = argv
#     print(argv)
#     ms1 = ml.MeshSet()
#     ms1.load_new_mesh(file1)
#     ms1.load_new_mesh(file2)
#     ms1.generate_boolean_difference()
#     ms1.save_current_mesh(file2_result)
#     ms2 = ml.MeshSet()
#     ms2.load_new_mesh(file1)
#     ms2.load_new_mesh(file3)
#     ms2.generate_boolean_difference()
#     ms2.save_current_mesh(file3_result)

def main(argv):
    #  file path from argv
    [file0,file1, file1_result, file2, file2_result, ] = argv
    print(argv)

    start_time = time.time()

    ms1 = ml.MeshSet()
    ms2 = ml.MeshSet()

    # Load meshes in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future1 = executor.submit(ms1.load_new_mesh, file0)
        future2 = executor.submit(ms1.load_new_mesh, file2)
        future3 = executor.submit(ms2.load_new_mesh, file0)
        future4 = executor.submit(ms2.load_new_mesh, file1)

        # Wait for all meshes to be loaded
        concurrent.futures.wait([future1, future2, future3,future4])

    # Generate boolean differences in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future1 = executor.submit(ms1.generate_boolean_difference)
        future2 = executor.submit(ms2.generate_boolean_difference)

        # Wait for both boolean differences to be generated
        concurrent.futures.wait([future1, future2])

    # Save meshes in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future1 = executor.submit(ms1.save_current_mesh, file2_result)
        future2 = executor.submit(ms2.save_current_mesh, file1_result)

        # Wait for both meshes to be saved
        concurrent.futures.wait([future1, future2])
        
    end_time = time.time()
    print(f"Total execution time: {end_time - start_time:.2f} seconds")


#  main
if __name__ == '__main__':
    main(sys.argv[1:])
