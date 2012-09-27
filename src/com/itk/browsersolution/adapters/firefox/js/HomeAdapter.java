/*
 * HomeAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import java.io.File;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;

/**
 * Class HomeAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class HomeAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("SER#005") < 0) {
            TextCursor cursor = new TextCursor(bf, 0);
            
            if (cursor.find("for (var i=0; i < navlen; i++)")) {
                cursor.replace(30, "for (var i=navlen-1; i >= 0; i--)");
                cursor.goEndLine();
                cursor.insert("// SER#005:1.0: Modified to support Firefox");
                modified = true;
            }else
            {
                modified = false;
            }
            
            if (modified
                && cursor.find("for (var i=0;i<nuglen;i++)")) {
                cursor.replace(26, "for (var i=nuglen-1; i >= 0; i--)");
                cursor.goEndLine();
                cursor.insert("// SER#005:1.0: Modified to support Firefox");
                modified = true;
            }else
            {
                modified = false;
            }
            
            if (modified 
                    && cursor.find("n=arrNavlets[i]")) {
                do {
                    cursor.insert("if (arrNavlets[i] && arrNavlets[i].parentNode) {// SER#005:1.0: Modified to support Firefox\n\t\t\t\t");
                    cursor.goNextLine();
                    cursor.insert("\t");
                    cursor.goNextLine();
                    cursor.insert("\t\t\t}\n");
                    modified = true;
                } while (cursor.nextIndexOf("n=arrNavlets[i]") > 0);
                cursor.goStartText();
            }else
            {
                modified = false;
            }

            if (modified
                    && cursor.find("n=arrNuglets[i]")) {
                do {
                    cursor.insert("if (arrNuglets[i] && arrNuglets[i].parentNode) {// SER#005:1.0: Modified to support Firefox\n\t\t\t\t");
                    cursor.goNextLine();
                    cursor.insert("\t");
                    cursor.goNextLine();
                    cursor.insert("\t\t\t}\n");
                    modified = true;
                } while (cursor.nextIndexOf("n=arrNuglets[i]") > 0);
                cursor.goStartText();
            }else
            {
                modified = false;
            }

            if (modified) {
                FileUtils.saveText(file, bf);
            }
        }
        
        return modified;
    }
    
}
