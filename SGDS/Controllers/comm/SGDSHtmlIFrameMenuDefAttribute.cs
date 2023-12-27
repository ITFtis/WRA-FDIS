using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SGDS.Controllers.comm
{
    public class SGDSHtmlIFrameMenuDefAttribute: HtmlIFrameMenuDefAttribute
    {
        string _Url = null;
        public override string Url { 
            set
            {
                if (_Url == null)
                {
                    if (value.IndexOf("http") >= 0)
                    {
                        _Url = value;
                    }
                    else
                    {
                        var rurl = HttpContext.Current.Request.Url;
                        if (rurl.Host != "www.dprcflood.org.tw")
                            _Url = "https://www.dprcflood.org.tw/SGDS/" + value;
                        else
                            _Url = rurl.Scheme + "://" + rurl.Host + "/SGDS/" + value;
                    }
                }
            }
            get
            {
                return _Url;
            }
        }
    }
}