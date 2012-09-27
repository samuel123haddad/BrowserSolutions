/*
 * PortalAdapter.java
 */
package com.itk.browsersolution.adapters.v90110.all.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class PortalAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class PortalAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (cursor.find("function sizePortalStuff()")
                && cursor.findNext("{")
                && !cursor.findNext("/* START - Modified by Samuel Haddad - Support Chrome 05/09/2012 - Event loop*/")
                && cursor.findNext("if (lawsonPortal == null) { portalOnLoad(); return;}")
                && cursor.firstIndexOf("function setInitialFocus()") > cursor.getPos()
                ) {
            cursor.goStartLine();
            cursor.deleteLine("if (lawsonPortal == null) { portalOnLoad(); return;}");
            cursor.goPreviousLine();
            cursor.goEndLine();
            cursor.insertLine("	/* START - Modified by Samuel Haddad - Support Chrome 05/09/2012 - Event loop*/");
            cursor.insertLine("	if (lawsonPortal == null) return;");
            cursor.insertLine("	/* END - Modified by Samuel Haddad - Support Chrome 05/09/2012 */");
            
            modified = true;
            
        }
        if (modified) {
            FileUtils.saveText(file, bf);
        }
        
        
        return modified;
    }
    
}
