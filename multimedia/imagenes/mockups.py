import cv2, numpy as np, sys
def comp(base, shot, out):
    img=cv2.imread(base); scr=cv2.imread(shot)
    hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    m=cv2.inRange(hsv,(40,120,120),(85,255,255))
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    c=max(cs,key=cv2.contourArea)
    hull=cv2.convexHull(c)
    eps=0.01*cv2.arcLength(hull,True)
    for k in range(40):
        ap=cv2.approxPolyDP(hull,eps,True)
        if len(ap)<=4: break
        eps*=1.25
    pts=ap.reshape(-1,2).astype(np.float32)
    assert len(pts)==4, len(pts)
    s=pts.sum(1); d=np.diff(pts,axis=1).ravel()
    q=np.array([pts[s.argmin()],pts[d.argmin()],pts[s.argmax()],pts[d.argmax()]],np.float32) # tl,tr,br,bl
    cen=q.mean(0); q=(cen+(q-cen)*1.06).astype(np.float32)
    h,w=scr.shape[:2]
    src=np.array([[0,0],[w,0],[w,h],[0,h]],np.float32)
    M=cv2.getPerspectiveTransform(src,q)
    warp=cv2.warpPerspective(scr,M,(img.shape[1],img.shape[0]),flags=cv2.INTER_AREA)
    # máscara: interior del cuadrilátero intersectado con el verde dilatado (respeta esquinas redondeadas y notch)
    poly=np.zeros(m.shape,np.uint8); cv2.fillConvexPoly(poly,q.astype(np.int32),255)
    mm=cv2.dilate(m,np.ones((3,3),np.uint8),iterations=3)
    mask=cv2.bitwise_and(poly,mm)
    mask=cv2.GaussianBlur(mask,(3,3),0).astype(np.float32)/255
    # leve oscurecido para integrar con la luz de la escena
    warp=(warp.astype(np.float32)*0.93)
    o=img.astype(np.float32)*(1-mask[...,None])+warp*mask[...,None]
    # quitar el reflejo verde alrededor del dispositivo (teclado, marco)
    x0,y0=q.min(0).astype(int); x1,y1=q.max(0).astype(int); hh=y1-y0; ww=x1-x0
    X0=max(0,x0-int(ww*.25)); X1=min(o.shape[1],x1+int(ww*.25)); Y0=max(0,y0-10); Y1=min(o.shape[0],y1+int(hh*.6))
    reg=o[Y0:Y1,X0:X1]; inside=mask[Y0:Y1,X0:X1]>0.5
    b,g,r=reg[...,0],reg[...,1],reg[...,2]; mx=np.maximum(b,r)
    spill=(g>mx+12)&(~inside)
    g2=np.where(spill, mx+ (g-mx)*0.1, g); reg[...,1]=g2
    cv2.imwrite(out,o.clip(0,255).astype(np.uint8),[cv2.IMWRITE_JPEG_QUALITY,92])
    print(out,q.tolist())
A='/mnt/user-data/attachments/39890a4d-bfba-5c6a-b8a2-81f852164a1a/'
B='/mnt/user-data/uploads/iest-tfi_Pointer/multimedia/imagenes/'
comp(B+'05-mockup-notebook.jpg',A+'88af592b-image.png','05-mockup-notebook-pointer.jpg')
comp(B+'06-mockup-celular.jpg',A+'36987b7e-image.png','06-mockup-celular-pointer.jpg')
