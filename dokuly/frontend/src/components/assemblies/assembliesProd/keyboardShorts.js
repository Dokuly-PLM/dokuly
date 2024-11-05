import React, { useState } from 'react'

const KeyboardShorts = (props) => {

    const keyStyle = {
        'borderRadius': "3px",
        'padding': "1px 2px 0",
        'border': "1px solid black",
        'width' : 'fit-content',
        'height' : 'fit-content',
    }

    return (
        <div>
            {/* <!-- Button trigger modal --> */}
            <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#keyboardShorts">
                Keyboard Shortcuts
            </button>

            {/* <!-- Modal --> */}
            <div className="modal fade" id="keyboardShorts" tabIndex="-1" role="dialog" aria-labelledby="keyboardShortsLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="keyboardShortsLabel">Keyboard shortcuts for node graph</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    <div className="modal-body">
                        <div className="row p-2">
                            <h6><b>Fast Connect:</b></h6>
                            <h6>Press and hold Left Control <a style={keyStyle}>Ctrl</a>. Then click on a node. Release <a style={keyStyle}>Ctrl</a>. Now click on the node you want to make a connection to.</h6>
                        </div>
                    </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default KeyboardShorts
