@rem SPDX-License-Identifier: Apache-2.0
@echo off
setlocal
set APP_HOME=%~dp0
if defined JAVA_HOME (
  set JAVA_EXE=%JAVA_HOME%\bin\java.exe
) else (
  set JAVA_EXE=java.exe
)

"%JAVA_EXE%" "-Dorg.gradle.appname=%~n0" -classpath "%APP_HOME%gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
endlocal & exit /b %ERRORLEVEL%
