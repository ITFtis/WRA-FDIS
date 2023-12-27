using Dou.Models;
using Newtonsoft.Json;
using RestSharp;
using SGDS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Manager
{
    // GET: User
    [Dou.Misc.Attr.MenuDef(Id = "User", Name = "使用者管理", MenuPath = "系統管理", Action = "Index", Func = Dou.Misc.Attr.FuncEnum.ALL, AllowAnonymous = false)]
    public class UserController : Dou.Controllers.UserBaseControll<User, Role>
    {
        public DouModelContextExt db = new DouModelContextExt();
        // GET: User
        public ActionResult Index()
        {
            return View();
        }

        protected override Dou.Models.DB.IModelEntity<User> GetModelEntity()
        {
            return new Dou.Models.DB.ModelEntity<User>(RoleController._dbContext);
        }




        public ActionResult Login(string oauthServer, string code, string redirect_uri)
        {




            return PartialView("DouLoginError");//, new { u=user, msg= ViewBag.ErrorMessage });

        }


        public override ActionResult DouLogin(User user, string returnUrl, bool redirectLogin = false)
        {
            //若是SSO會在URL出現CODE
            var oauthServer = HttpContext.Request.QueryString["oauthServer"];
            var code = HttpContext.Request.QueryString["code"];
            var redirect_uri = HttpContext.Request.QueryString["redirect_uri"];




            if (code != null)
            {


                var LoginToken = GetToken(code);//取TOKEN

                var SsoUser = GetUser(LoginToken);//取USER


                string mail = SsoUser.mail;
                string sAMAccountName = SsoUser.sAMAccountName;
                string displayName = SsoUser.displayName;
                string mobile = SsoUser.mobile;
                string dn = SsoUser.dn;
                string title = SsoUser.title;



                string pw = "1234@1qaz#EDC";



                User u = FindUser(sAMAccountName);//已驗證，故直接取系統使用者
                redirectLogin = false;
                if (u != null)
                {
                    user = u;
                    //更新本身系統user
                    if (!Dou.Context.Config.VerifyPassword(u.Password, pw))
                    {

                        u.EMail = mail;
                        u.Name = displayName;
                        u.Tel = mobile;
                        u.Unit = title;


                        this.UpdateDBObject(GetModelEntity(), new User[] { u });
                    }
                }
                else//系統尚無此使用者
                {

                    user = new User() { Id = sAMAccountName, Name = displayName, Password = Dou.Context.Config.PasswordEncode(pw), EMail = mail, Tel = mobile, Unit = title, Enabled = true };


                    this.AddDBObject(GetModelEntity(), new User[] { user });
                    var role = new RoleUser() { UserId = sAMAccountName, RoleId = "user" };
                    db.RoleUser.Add(role);
                    db.SaveChanges();
                }




                ActionResult v = base.DouLogin(user, returnUrl, redirectLogin);


                return v is RedirectResult || v is RedirectToRouteResult ? v : PartialView(user);











            }
            return base.DouLogin(user, returnUrl, redirectLogin);




        }


        //用Token取USER
        public Userdata GetUser(string Token)
        {
            var URL = "https://cloud.wra.gov.tw/oauth2ServerInfo.do";
            var client = new RestClient(URL);
            client.Timeout = -1;
            var request = new RestRequest(Method.POST);
            request.AddHeader("Authorization", "Bearer " + Token);
            IRestResponse response = client.Execute(request);



            Userdata person = JsonConvert.DeserializeObject<Userdata>(response.Content);



            return person;

        }


        //用code取TOKEN
        public string GetToken(string code)
        {
            var URL = "https://cloud.wra.gov.tw/oauth2ServerToken.do?";
            URL += "grant_type=authorization_code";
            URL += "&client_id=dprcflood";
            URL += "&client_secret=FDIS@1qaz";
            URL += "&code=" + code;
           // URL += "&redirect_uri=http://localhost:45953/User/DouLogin";
            URL += "&redirect_uri=https://floodinfo.wra.gov.tw/FDIS/User/DouLogin";


            var LoginToken = DouHelper.HClient.Post<LoginToken>(URL);

            return LoginToken.Result.Result.access_token;

        }

        public class Userdata
        {

            public string mail { get; set; }
            public string sAMAccountName { get; set; }
            public string displayName { get; set; }
            public string mobile { get; set; }
            public string dn { get; set; }
            public string title { get; set; }



        }


        public class LoginToken
        {
            public string access_token { get; set; }
            public string errorMessage { get; set; }
        }
    }
}