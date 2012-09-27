/*
 * CommonAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import java.io.File;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.vo.ParameterQuestionHolder;

/**
 * Class CommonAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class CommonAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        
        if (bf.indexOf("SER#003") < 0) {
            String from = "if ( !node.hasChildNodes() ) return;";
            String to = "if ( !node || !node.hasChildNodes() ) return; // SER#003::1.0: Modified to support Firefox";
            int ps = -1;
            while ((ps = bf.indexOf(from, ps + 1)) > 0) {
                bf.replace(ps, ps + from.length(), to);
                ps += to.length();
                modified = true;
            }
            if (modified) {
                FileUtils.saveText(file, bf);
            }
        }
        
        
        return modified;
    }
    
}
