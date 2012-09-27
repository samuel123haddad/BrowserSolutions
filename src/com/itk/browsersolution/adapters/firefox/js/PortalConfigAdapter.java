/*
 * PortalConfigAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class PortalConfigAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class PortalConfigAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("SER#001") < 0) {
            int ps = bf.indexOf("nbrScripts > 0");
            int pse = bf.indexOf("nbrScripts > 0", ps + 14);
            int count = 5;
            while ((ps = bf.indexOf("i", ps + 1)) > 0 && count > 0 && ps < pse) {
                if ((bf.charAt(ps + 1) != 'f') && (bf.charAt(ps - 1) == ' ' || bf.charAt(ps - 1) == '[')) {
                    bf.replace(ps, ps + 1, "j");
                    count--;
                }
            }
            if (count != 5) {
                TextCursor cursor = new TextCursor(bf, pse);
                cursor.goPreviousLine();
                cursor.goEndLine();
                cursor.insert("\n\t\t// SER#001::1.0: Modified to support Firefox\n");
                FileUtils.saveText(file, bf);
                modified = true;
            }
        }
        
        
        return modified;
    }
    
}
