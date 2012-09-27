/*
 * SSOAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class SSOAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class SSOAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        
        TextCursor cursor = new TextCursor(bf, 0);
        if (cursor.nextIndexOf("var ssoStatus = res.getResponseHeader(\"SSO_STATUS\");") > 0) {
            cursor.goEndLine();
            cursor.goPreviousColumn();
            cursor.insert("||\"\"");
            
            modified = true;
            
        }
        
        if (
                !cursor.find("/* START - Modified by Samuel Haddad - Support Opera 30/08/2012 */") 
                && cursor.find("function SSOBrowser()")
                ) 
        {
            if (cursor.findNext("this.isSAF	 = false;"))
            {
                cursor.goEndLine();
                cursor.insert("\n");
                cursor.insert("	/* START - Modified by Samuel Haddad - Support Opera 30/08/2012 */");
                cursor.insert("\n");
                cursor.insert("	this.isOPE	 = false;");
                cursor.insert("\n");
                cursor.insert("	/* END - Modified by Samuel Haddad - Support Opera 30/08/2012 */");
                
                if (cursor.findNext("else if (an == \"Netscape\")"))
                {
                    if (cursor.findNext("this.version = parseFloat(navigator.vendorSub);") 
                            && cursor.goEndLine()
                            && cursor.findNext("}") 
                            && cursor.goEndLine()
                            && cursor.findNext("}") )
                    {
                        cursor.goEndLine();
                        cursor.insert("\n");
                        cursor.insert("	/* START - Modified by Samuel Haddad - Support Opera 30/08/2012 */");
                        cursor.insert("\n");
                        cursor.insert("	else if (an == \"Opera\")");
                        cursor.insert("\n");
                        cursor.insert("		{");
                        cursor.insert("\n");
                        cursor.insert("		// Opera lies and says it's Netscape");
                        cursor.insert("\n");
                        cursor.insert("		if (ua.indexOf(\"Opera\") != -1)");
                        cursor.insert("\n");
                        cursor.insert("		{");
                        cursor.insert("\n");
                        cursor.insert("			var key = \"Version/\";");
                        cursor.insert("\n");
                        cursor.insert("			this.isNS = true;");
                        cursor.insert("\n");
                        cursor.insert("			this.isOPE = true;");
                        cursor.insert("\n");
                        cursor.insert("			this.version = parseFloat(ua.substr(ua.indexOf(key) + key.length));");
                        cursor.insert("\n");
                        cursor.insert("		}");
                        cursor.insert("\n");
                        cursor.insert("		else");
                        cursor.insert("\n");
                        cursor.insert("		{");
                        cursor.insert("\n");
                        cursor.insert("			var key = \"(\";");
                        cursor.insert("\n");
                        cursor.insert("			this.isNS = true;");
                        cursor.insert("\n");
                        cursor.insert("			this.version = parseFloat(navigator.appVersion.substring(0, navigator.appVersion.indexOf(key) ));");
                        cursor.insert("\n");
                        cursor.insert("		}");
                        cursor.insert("\n");
                        cursor.insert("	}");
                        cursor.insert("\n");
                        cursor.insert("	/* END - Modified by Samuel Haddad - Support Opera 30/08/2012 */");
                        cursor.insert("\n");
        
                        if (!modified)
                        {
                            modified = true;
                        }
                        
                    } else 
                    {
                        return false;
                    }
                }else
                {
                    return false;
                }
                
            }else
            {
                return false;
            }
        }else
        {
            return false;
        }
        
        
        
        if (
                !cursor.find("/* START - Modified by Samuel Haddad - Support Opera 31/08/2012 */") 
                && cursor.find("function SSORequest(url, pkg, cntType, outType, bShowErrors)")
                ) 
        {
            if (cursor.findNext("if (typeof(url) == \"undefined\" || url == null || url == \"\")"))
            {
                cursor.goEndLine();
                
                if (cursor.findNext("return errorMsg;"))
                {
                    if (
                            cursor.goEndLine()
                            && cursor.findNext("}") 
                            )
                    {
                        cursor.goEndLine();
                        cursor.insert("\n");
                        cursor.insert("	        /* START - Modified by Samuel Haddad - Support Opera 31/08/2012 */");
                        cursor.insert("\n");
                        cursor.insert("		if (browser.isSAF) {");
                        cursor.insert("\n");
                        cursor.insert("			if (typeof url.slice == 'undefined')");
                        cursor.insert("\n");
                        cursor.insert("				alert(\"slice undefined\");");
                        cursor.insert("\n");
                        cursor.insert("			else if (typeof url.indexOf == 'undefined')");
                        cursor.insert("\n");
                        cursor.insert("				alert(\"indexOf undefined\");");
                        cursor.insert("\n");
                        cursor.insert("");
                        cursor.insert("\n");                        
                        cursor.insert("			if (url.slice(0,7) == \"http://\" || url.slice(0,8) == \"https://\") {");
                        cursor.insert("\n");
                        cursor.insert("				url = url.slice(url.indexOf(\"/\",8));");
                        cursor.insert("\n");
                        cursor.insert("			}");
                        cursor.insert("\n");
                        cursor.insert("		}");
                        cursor.insert("\n");
                        cursor.insert("		/* END - Modified by Samuel Haddad - Support Opera 31/08/2012 */");
                        cursor.insert("\n");
                        	
                        modified = true;
                        
                    }
                    else
                    {
                        return false;
                    }
                }else
                {
                    return false;
                }

            }else
            {
                return false;
            }
        }
        else
        {
            return false;
        }
        
        
        if (modified)
        {
            FileUtils.saveText(file, bf);
        }
        
        return modified;
    }
    
}
