/*
 * IndexAdapter.java
 */
package com.itk.browsersolution.adapters.v90110.all.html;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class IndexAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class IndexAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("<script language=\"javascript\" src=\"browserCheck.js\"></script>") < 0) {
            TextCursor cursor = new TextCursor(bf);
            if (
                    !cursor.find("/* START - Modified by Samuel Haddad - Support W3C - Adding browserCheck.js - LS version 9.0.1.10 - 07/09/2012 */")
                    && cursor.find("<script language=\"javascript\" src=\"objects/SortArray.js\"></script>")
                   
                    ) {
                if (cursor.goEndLine()) {

                    cursor.insertLine("	<!-- /* START - Modified by Samuel Haddad - Support W3C - Adding browserCheck.js - LS version 9.0.1.10 - 07/09/2012 */ -->");
                    cursor.insertLine("	<script language=\"javascript\" src=\"browserCheck.js\"></script>");
                    cursor.insertLine("	<!-- /* END - Modified by Samuel Haddad - Support W3C - Adding browserCheck.js - LS version 9.0.1.10 - 07/09/2012 */ -->");
                    modified = true;
                }
            }
        }

        if (bf.indexOf("<body onload=\"portalOnLoad()\" onunload=\"portalUnload()\" tabIndex=\"-1\" scroll=\"no\" onkeydown=\"onPortalKeyDown(event)\" ") >= 0) {
            TextCursor cursor = new TextCursor(bf);
            if (    !cursor.find("/* START - Modified by Samuel Haddad - Support W3C - CheckBrowser function - LS version 9.0.1.10 - 07/09/2012 */")
                    && cursor.deleteLine("<body onload=\"portalOnLoad()\" onunload=\"portalUnload()\" tabIndex=\"-1\" scroll=\"no\" onkeydown=\"onPortalKeyDown(event)\" ")) {
                cursor.goPreviousLine();                
                if (cursor.goEndLine()) {

                    cursor.insertLine("<!-- /* START - Modified by Samuel Haddad - Support W3C - CheckBrowser function - LS version 9.0.1.10 - 07/09/2012 */ -->");
                    cursor.insertLine("<body onload=\"checkBrowser(); portalOnLoad();\" onunload=\"portalUnload()\" tabIndex=\"-1\" scroll=\"no\" onkeydown=\"onPortalKeyDown(event)\"");
                    if (cursor.findNext("onresize=\"sizePortalStuff()\""))
                    {
                        cursor.goEndLine();
                        cursor.insertLine("<!-- /* END - Modified by Samuel Haddad - Support W3C - CheckBrowser function - LS version 9.0.1.10 - 07/09/2012 */ -->");
                    }                    
                    modified = true;
                }
            }
        }
        if (modified)
        {
            FileUtils.saveText(file, bf);
        }
               
        return modified;
    }
    
}
