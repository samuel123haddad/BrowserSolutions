/*
 * PagesAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class PagesAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class PagesAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (!cursor.find("SER#007")) {
            if (cursor.nextIndexOf("if(typeof(window[evtSource+\"_\"+evtName])==\"function\")") > 0) {
                cursor.goNextLine();
                cursor.goNextLine();
                if (!cursor.isText("			try {")) {
                    cursor.insert("			try {// SER#007:1.0: Modified to support Firefox\n");
                    cursor.nextIndexOf("return true;");
                    cursor.goStartLine();
                    cursor.insert("			} catch(e) {}\n");
                    FileUtils.saveText(file, bf);
                    modified = true;
                }
            }
        }
        
        
        return modified;
    }
    
}
