const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;
const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;


const CONLICT_UUID = [];
const WINDOW_ANIMATION_TIME = 0.24;
const ROTATION_ANGLE = 7;

const RotateInForWindow = new Lang.Class({
    
    Name: "RotateInForWindow",
    
    _init: function (){
        
        this._display =  global.screen.get_display();
        
        this.signalConnectID = this._display.connect('window-created', Lang.bind(this, this._rotateIn));

        global._rotate_in_aminator = this;
        
        this._x_half = global.screen_width/2;
        this._y_half = global.screen_height/2;
        
    },
    _rotateIn : function (display,window){
    
         //FIXME: Workaround for Chromium, I don't know what to do with chromium, it appears that Chromium will decorate itself and not telling WM.
         if (window.get_wm_class() == 'Chromium-browser')
            return true;
        
        if (!window.maximized_horizontally && window.get_window_type() == Meta.WindowType.NORMAL){
            

            
            let actor = window.get_compositor_private();
            
            [prevX,prevY] = actor.get_position();
            [width,height] = actor.get_size();
            
            let centerX = (prevX+Math.round(width/2));
            let centerY = (prevY+Math.round(height/2));
            
            let x_flag = centerX - this._x_half;
            let y_flag = centerY - this._y_half;
            
            let vertex = new Clutter.Vertex ({ x:(x_flag < 0 )?0:width,
                                                y:(y_flag < 0 )?0:height,
                                                z:0});
            actor.rotation_center_z = vertex;
            
            //FIXME why "rotation_angle_z" won't work if we use it in Tweener directly?
            actor._rz = ( x_flag*y_flag < 0 )?-ROTATION_ANGLE:ROTATION_ANGLE;
            actor.rotation_angle_z = actor._rz;

            Tweener.addTween(actor,{
                                 _rz:0,
                                 onUpdateScope: actor,
                                 onUpdate: function(){
                                    actor.rotation_angle_z = actor._rz;
                                 },
                                 time: WINDOW_ANIMATION_TIME,
                                 transition: "easeOutQuad",
                                 onCompleteScope:this,
                                 onComplete: this._animationDone,
                                 onCompleteParams: [actor],
                                 onOverwrite : this._animationDone,
                                 onOverwriteScope : this,
                                 onOverwriteParams: [actor]
                            });
            
        };
    },
    _animationDone : function (actor){
        actor.rotation_angle_z = actor._rz = 0;
    },
    destroy : function (){
        delete global._rotate_in_aminator;
        this._display.disconnect(this.signalConnectID);
    },
    _onDestroy : function (){
        this.destroy();
    }
});

let rotatemaker = null;
let metadata = null;

function enable() {
    // check conflict extension
    for (var item in ExtensionUtils.extensions){
        
        if (CONLICT_UUID.indexOf(item.uuid) >= 0 && item.state == ExtensionSystem.ExtensionState.ENABLED){
            throw new Error('%s conflict with %s'.format(item,metadata.uuid));
            rotatemaker = 'CONFLICTED';
        }
        
    }
    
    if (rotatemaker == null){
        rotatemaker = new RotateInForWindow();
    }
}
function disable() {
    if (rotatemaker != null){
        rotatemaker.destroy();
        rotatemaker = null;
    }
}
function init(metadataSource) {
    metadata = metadataSource;
}
