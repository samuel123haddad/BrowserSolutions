Product Browser Solution for S3
===============================

# Sintax 

## Install
  java -jar LawsonbrowserPath.jar -w $WEBDIR -t $BKPDIR

You need access to write in WEBDIR.

<WEBDIR> is the path where is static files are installed : <WEBDIR>/lawson/portal 

## Install in lawsec

To use Opera is necessary install in lawsec to do this is necessary use:

 java -jar LawsonbrowserPath.jar -j <GENDIR>

 if the lawsec is not found you can use 

 java -jar LawsonbrowserPath.jar -j <LAWSEC.ear>
 
this command will modify lawsec.ear file, or use directly in WebSphere Expanded directory using:

 java -jar LawsonbrowserPath.jar -d <WAS_HOME>

## Uninstall

 java -jar LawsonbrowserPath.jar -w $WEBDIR -t $BKPDIR
 