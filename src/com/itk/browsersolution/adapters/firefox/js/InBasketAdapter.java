/*
 * InBasketAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import java.io.File;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;

/**
 * Class InBasketAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class InBasketAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (!cursor.find("SER#006")) {
            if (cursor.nextIndexOf("for (var i=0; i < variables.length; i++)") > 0) {
                cursor.findNext("{");
                cursor.goNextColumn();
                cursor.findNext("{");
                cursor.goNextColumn();
                cursor.insert(" try { // SER#006:1.1: Modified to support Firefox\n");
                cursor.findNext("}");
                cursor.insert("} catch(e) {} ");
                FileUtils.saveText(file, bf);
                modified = true;
            }
        }
        
        return modified;
    }
    
}
