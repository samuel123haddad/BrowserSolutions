/*
 * EditsAdapter.java
 */
package com.itk.browsersolution.adapters.v90110.all.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class EditsAdapter
 * Upgrade to Lawson 9.0.1.10.
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class EditsAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (cursor.find("function edPerformEdits(mElement)")) {
            if (cursor.findNext("case \"time\":")
                    && !cursor.findNext("/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */")
                    && cursor.findNext("mElement.value=edFormatTime(mElement.value, mElement.getAttribute(\"size\"))")
                    && cursor.firstIndexOf("function edFormatDecimal(value, decSZ)") > cursor.getPos()
                    ) {
                
                cursor.goStartLine();
                if (cursor.deleteLine("mElement.value=edFormatTime(mElement.value, mElement.getAttribute(\"size\"))")) 
                {
                    cursor.goPreviousLine();    
                    cursor.goEndLine();
                    
                    cursor.insertLine("			/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                    cursor.goEndLine();
                    cursor.insertLine("			value = edFormatTime(mElement.value, mElement.getAttribute(\"size\"))");
                    cursor.goEndLine();
                    cursor.insertLine("			if (value==\"\")");
                    cursor.goEndLine();
                    
                    cursor.insertLine("			{");
                    cursor.goEndLine();
                    cursor.insertLine("				mElement.focus()");
                    cursor.goEndLine();
                    cursor.insertLine("				mElement.select()");
                    cursor.goEndLine();
                    cursor.insertLine("			}");
                    cursor.goEndLine();
                    cursor.insertLine("			else");
                    cursor.goEndLine();
                    cursor.insertLine("				mElement.value = value;");
                    cursor.goEndLine();
                    cursor.insertLine("			/* END - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                    cursor.goEndLine();

                    modified = true;
                }else
                {
                    modified = false;
                }
                
                if (    modified
                        && !cursor.find("if (mElement.getAttribute(\"edit\") != \"date\")")
                        && !cursor.findNext("/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */")
                        && cursor.findNext("cmnErrorHandler(e,window,EDITJS); ")
                        && cursor.firstIndexOf("function edFormatDecimal(value, decSZ)") > cursor.getPos()
                        )
                {

                    if (cursor.deleteLine("cmnErrorHandler(e,window,EDITJS); ")) {
                        cursor.goPreviousLine();    
                        cursor.goEndLine();

                        cursor.insertLine("		/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                        cursor.goEndLine();
                        
                        cursor.insertLine("		if (mElement.getAttribute(\"edit\") != \"date\")");
                        cursor.goEndLine();
                        cursor.insertLine("			cmnErrorHandler(e,window,EDITJS); ");
                        cursor.goEndLine();

                        cursor.goEndLine();
                        cursor.insertLine("		/* END - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                        
                        modified = true;
                    }else
                    {
                        modified = false;
                    }
                }
                
                if (    modified
                        && cursor.find("function edFormatTime(strTime, size)")
                        && !cursor.findNext("/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */")
                        && cursor.findNext("	return (size==\"4\"")
                        && cursor.firstIndexOf("function edCheckDec(evt, elem)") > cursor.getPos()
                        )
                {

                    cursor.goPreviousLine();
                    cursor.goPreviousLine();    
                    cursor.goEndLine();

                    cursor.insertLine("	/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                    cursor.goEndLine();

                    cursor.insertLine("	var errMsg = \"\";");
                    cursor.goEndLine();
                    
                    cursor.insertLine("	if (hours < 0 || hours > 23)");
                    cursor.goEndLine();

                    cursor.insertLine("		errMsg = \"Hour must be between 0 to 23\";");
                    cursor.goEndLine();

                    cursor.insertLine("	else");
                    cursor.goEndLine();

                    cursor.insertLine("		if (mins < 0 || mins > 59)");
                    cursor.goEndLine();

                    cursor.insertLine("			errMsg = \"Minutes must be between 0 to 59\";");
                    cursor.goEndLine();

                    cursor.insertLine("		else");
                    cursor.goEndLine();

                    cursor.insertLine("			if (secs < 0 || secs > 59)");
                    cursor.goEndLine();

                    cursor.insertLine("				errMsg = \"Seconds must be between 0 to 59\";");
                    cursor.goEndLine();

                    cursor.insertLine("	if (errMsg != \"\")");
                    cursor.goEndLine();
                    
                    cursor.insertLine("	{");
                    cursor.goEndLine();

                    cursor.insertLine("		setTimeout(\"lawsonPortal.setMessage(\\\"\"+errMsg+\"\\\")\",1)");
                    cursor.goEndLine();

                    cursor.insertLine("		return \"\";");
                    cursor.goEndLine();

                    cursor.insertLine("	}	");
                    cursor.goEndLine();

                    cursor.insertLine("	else");
                    cursor.goEndLine();
                    
                    if (cursor.findNext("	return (size==\"4\""))
                    {
                        cursor.deleteLine("	return (size==\"4\"");
                        cursor.deleteLine("		? hours + timeSep + mins");
                        cursor.deleteLine("		: hours + timeSep + mins + timeSep + secs);");
                        cursor.goPreviousLine();

                        cursor.insertLine("		return (size==\"4\"");
                        cursor.insertLine("			? hours + timeSep + mins");                        
                        cursor.insertLine("			: hours + timeSep + mins + timeSep + secs);");                        

                        cursor.goEndLine();
                        cursor.insertLine("	/* END - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                        
                        modified = true;
                        
                    }else
                    {
                        modified = false;
                    }
                }
                
            }
        }
        if (modified) {
            FileUtils.saveText(file, bf);
        }
        
        
        
        return modified;
    }
    
}
