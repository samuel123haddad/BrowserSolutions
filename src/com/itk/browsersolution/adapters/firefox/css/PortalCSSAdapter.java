/*
 * PortalCSSAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.css;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import java.io.File;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;

/**
 * Class PortalCSSAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class PortalCSSAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("SER#010") < 0) {
            TextCursor cursor = new TextCursor(bf);
            if (cursor.find("div.tabContainer div")) {
                if (cursor.findNext("9px")) {
                    cursor.replace(1, "7");
                    cursor.goEndLine();
                    cursor.insert("/* SER#010.1 - Modified to ajust tab in chrome/firefox */");
                    FileUtils.saveText(file, bf);
                    modified = true;
                }
            }
        }
        
        return modified;
    }
    
}
