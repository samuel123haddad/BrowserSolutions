/*
 * GlobalsAdapter.java
 */
package com.itk.browsersolution.adapters.v90110.all.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class GlobalsAdapter Upgrade to Lawson 9.0.1.10.
 *
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class GlobalsAdapter implements IJavaScriptAdapter {

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (!cursor.find("var AFSERVICE=null;")
                && !cursor.findNext("/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */")) {
            if (cursor.findNext("var IEXMLSERVICE=null;")) {

                cursor.goEndLine();
                cursor.insertLine("/* START - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");
                cursor.goEndLine();                
                cursor.insertLine("var AFSERVICE=null;");
                cursor.goEndLine();
                cursor.insertLine("/* END - Modified by Samuel Haddad - Support W3C LS version 9.0.1.10 - 07/09/2012 */");

                modified = true;
            }
            
        }
        
        if (modified) {
            FileUtils.saveText(file, bf);
        }
        
        return modified;

    }
}