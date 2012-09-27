/*
 * BrowserCheckAdapter.java
 */
package com.itk.browsersolution.adapters.opera.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class CheckBrowserAdapter
 * Implements changes to keep compatibility with Opera Browser.
 * Actually the javascript source code in /lawson/portal/browserCheck.js 
 * disable javascript support for Opera Browser and we must enable support 
 * to this Browser.
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class BrowserCheckAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        
        
        String[] lines = new String[]
            {
                "//else if (browser == \"Opera\" ){",
                "//	if (version < operaVerMin){",
                "//	var r=confirm(\"message\");",
                "//		if (r==true)",
                "//		  {",
                "//		  window.location=\"http://www.opera.com/download/\";",
                "//		  }",
                "//		else",
                "//		  {",
                "//		  window.location=estesMe;",
                "//		  ",
                "//		  }",
                "//		}",
                "//}"
            };

        cursor.goStartLine();
        for (String line : lines)
        {
            if (cursor.find(line)) {
                cursor.goStartLine();
                if (cursor.findNext("//")) {
                    cursor.delete(2);
                    cursor.goNextLine();
                }
                else
                {
                    modified = false;
                    break;
                }
            }
            modified = true;

        }
        if (modified) {
            FileUtils.saveText(file, bf);
        }
        return modified;
    }
    
}
