/*
 * FormUtilAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import java.io.File;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;

/**
 * Class FormUtilAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class FormUtilAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("SER#011") < 0) {
            TextCursor cursor = new TextCursor(bf);
            if (cursor.find("strXpress+=strXML")) {
                cursor.insert("strXpress=lawsonPortal.formsDir+\"/formhost2.htm?\"+strXML.replace(/=html&/g,\"=xml&\"); /* SER#011.1 - Modified to compatibility with chrome/safari/firefox */ //");
                FileUtils.saveText(file, bf);
                modified = true;
            }
        }
        return modified;
    }
    
}
