/*
 * CommonAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class CommonAdapter
 * Refactored
 * 
 * 
 * Obs: This class actually do not change nothing as well as before refactoring !!!!!!!!!!!!!!!!!!!!!
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class MagicAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("SER#012") < 0) {
            TextCursor cursor = new TextCursor(bf);
            if (cursor.find("Magic.prototype.transact=function(FC, bHasData)")) {
                if (cursor.findNext("if (typeof(this.formWnd.FORM_OnBeforeTransaction")) {
                    if (cursor.findNext("{")) {
                        cursor.goNextLine();
                        cursor.insert("		// SER#012.1 - Modified to compatibility with chrome/safari/firefox\n");
                        cursor.insert("		if ((typeof oFrm != 'undefined') && this.formWnd && this.formWnd.parent && (typeof this.formWnd.parent.oFrm == 'undefined'))\n");
                        cursor.insert("			this.formWnd.parent.oFrm = oFrm;\n");
                    }
                }
            }
        }
        
        return modified;
    }
    
}
