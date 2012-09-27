/*
 * LoginAdapter.java
 */
package com.itk.browsersolution.mods.last4digitvalidation.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class LoginAdapter
 * Apply Last 4 Digits Validation in index.html
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class LoginAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        
        TextCursor cursor = new TextCursor(bf, 0);
        if (!cursor.find("/* START - Modified by Samuel Haddad - Added function validate to support Mod Login 4 digits - 25/09/2012 */")) {

            cursor.findLast("}");

            cursor.goEndLine();
            
            cursor.insert("");
            cursor.insert("//-----------------------------------------------------------------------------");
            cursor.insert("/* START - Modified by Samuel Haddad - Added function validate to support Mod Login 4 digits - 25/09/2012 */");
            cursor.insert("function validateUserLastFourDigitsNumeric() {");
            cursor.insert("");
            cursor.insert("    if (window.location.hostname == \"#$$$hostname$$$#\")");
            cursor.insert("    {");
            cursor.insert("		var ssoUserInput = document.forms[0]._ssoUser;");
            cursor.insert("		var ssoUser = \"\";");
            cursor.insert("		if (ssoUserInput)");
            cursor.insert("		{");
            cursor.insert("			ssoUser = ssoUserInput.value;");
            cursor.insert("		}");
            cursor.insert("");
            cursor.insert("");
            cursor.insert("		if (ssoUser.length >= 4)");
            cursor.insert("		{");
            cursor.insert("			ssoUser = ssoUser.substring(ssoUser.length - 4, ssoUser.length);");
            cursor.insert("		}");
            cursor.insert("		if (! /\\d{4}/.test(ssoUser)) {");
            cursor.insert("");
            cursor.insert("			var msg = \"Invalid User.\";");
            cursor.insert("			alert(msg);");
            cursor.insert("");
            cursor.insert("			return false;");
            cursor.insert("");
            cursor.insert("		}else");
            cursor.insert("		{");
            cursor.insert("			return true;");
            cursor.insert("		}");
            cursor.insert("");
            cursor.insert("    }else");
            cursor.insert("    {");
            cursor.insert("		return true;");
            cursor.insert("    }");
            cursor.insert("");
            cursor.insert("}");
            cursor.insert("/* END - Modified by Samuel Haddad - Added function validate to support Mod Login 4 digits - 25/09/2012 */");

            
            modified = true;
            
        }
        
        
        if (modified)
        {
            FileUtils.saveText(file, bf);
        }
        
        return modified;
    }
    
}
