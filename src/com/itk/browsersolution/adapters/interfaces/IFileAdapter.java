/*
 * IFileAdapter.java 
 * 
 */
package com.itk.browsersolution.adapters.interfaces;

import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Interface IFileAdapter
 * This is an identifier for File processor.
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 1.1
 */
public interface IFileAdapter {
    
    /**
     * Modifies the file content.
     * 
     * @param file File to be modified.
     * @param parameterQuestionHolder A list of parameters which must be replaced to the 
     * related questions answers in adapter implementation.
     * @return Returns <code>true</code> when file was modified otherwise returns <code>false</code>
     */
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder);
}
