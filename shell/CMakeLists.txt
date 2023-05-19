cmake_minimum_required(VERSION 3.0.0)
project(shell VERSION 0.1.0)

# # CGAL and its components
find_package(CGAL REQUIRED)

# # Boost and its components
find_package(Boost REQUIRED)


# include(CTest)
# enable_testing()

add_executable(shell main.cpp)

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)


# "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" --no-warn-unused-cli -DCMAKE_EXPORT_COMPILE_COMMANDS:BOOL=TRUE -DCMAKE_TOOLCHAIN_FILE=c:\dev\vcpkg\scripts\buildsystems\vcpkg.cmake -SC:/Users/druxi/Code/typescript-pe33jr/shell -Bc:/Users/druxi/Code/typescript-pe33jr/shell/build -G "Visual Studio 16 2019" -T host=x64 -A x64