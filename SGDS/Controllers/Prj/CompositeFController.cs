using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [SGDSHtmlIFrameMenuDef(Id = "CompositeF", Name = "複合淹水警戒", MenuPath = "淹水預警", Index = 3, Action = "Index", AllowAnonymous = false, Func = FuncEnum.None, Url = "https://www.dprcflood.org.tw/FloodPrevention/CompositeIndex/Map")]
    public class CompositeFController : EmbedHtmlController
    {
        // GET: CompositeF
        public ActionResult Index()
        {
            return View();
        }
    }
}