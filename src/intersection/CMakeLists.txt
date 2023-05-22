cmake_minimum_required(VERSION 3.0.0)
project(shell VERSION 0.1.0)


set(VCPKG_TARGET_TRIPLET x64-windows)

# CGAL and its components
find_package(CGAL CONFIG REQUIRED)

# Boost and its components
find_package(Boost REQUIRED)

# include(CTest)
# enable_testing()

add_executable(main main.cpp)
target_link_libraries(main PRIVATE CGAL::CGAL)

add_custom_command(TARGET main POST_BUILD
    COMMENT "Copying to output directory"
    COMMAND ${CMAKE_COMMAND} -E copy_directory $<TARGET_FILE_DIR:main> ${CMAKE_CURRENT_SOURCE_DIR}\\..\\..\\app\\intersection
    COMMAND_EXPAND_LISTS
)
