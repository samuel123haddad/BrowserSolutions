/*
 * LoginAdapter.java
 */
package com.itk.browsersolution.mods.last4digitvalidation.html;

import com.itk.browsersolution.adapters.interfaces.IHtmlAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class LoginAdapter
 * Apply Last 4 Digits Validation in index.html
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class LoginAdapter implements IHtmlAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        if (bf.indexOf("<FORM METHOD=") >= 0) {
            TextCursor cursor = new TextCursor(bf);
            if (
                    !cursor.find("<!-- /* START - Modified by Samuel Haddad - Added event validate to support Mod Login 4 digits - 25/09/2012 */ -->")
                    && cursor.find("<FORM METHOD=")
                   
                    ) {
                if (cursor.goPreviousLine()
                        && cursor.goEndLine()) {

                    cursor.insertLine("		<!-- /* START - Modified by Samuel Haddad - Added event validate to support Mod Login 4 digits - 25/09/2012 */ -->");
                    
                    if (cursor.find("<FORM METHOD=")
                            && !cursor.findNext("onsubmit"))
                    {
                        if (cursor.find("NAME=\"loginForm\""))
                        {
                            if (cursor.findNext(">"))
                            {
                                cursor.goPreviousColumn();
                                cursor.insert(" onsubmit=\"return validateUserLastFourDigitsNumeric(); \"");                                
                                cursor.goEndLine();
                                modified = true;
                            }
                        }

                    }
                    
                    cursor.insertLine("		<!-- /* END - Modified by Samuel Haddad - Added event validate to support Mod Login 4 digits - 25/09/2012 */ -->");
                    
                }
            }
        }

        if (modified)
        {
            FileUtils.saveText(file, bf);
        }
               
        return modified;
    }
    
}
