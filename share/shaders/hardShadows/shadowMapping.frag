varying vec3 normal;
varying vec4 ambientGlobal;

uniform int lightFlag[MAX_NUMBER_OF_LIGHTS];
uniform sampler2DShadow shadowTexture[MAX_NUMBER_OF_LIGHTS];
uniform float zFar[MAX_NUMBER_OF_LIGHTS];
uniform float zNear[MAX_NUMBER_OF_LIGHTS];

varying vec4 shadowTexCoord[MAX_NUMBER_OF_LIGHTS];
varying vec3 lightDir[MAX_NUMBER_OF_LIGHTS];
varying float dist[MAX_NUMBER_OF_LIGHTS];

#ifdef USE_TEXTURE
uniform sampler2D colorTexture;
#endif

float shadow_unroll(const int index, const sampler2DShadow shadowTexture) 
{ 
	float depth, depthSqr;
	depthSqr = dot(lightDir[index], lightDir[index]);
	depth = sqrt(depthSqr);
	depth = (depth - zNear[index])/(zFar[index] - zNear[index]);
	float shadow = shadow2DProj(shadowTexture, shadowTexCoord[index]).x;
	if (shadow < depth)
		shadow = 0.0;
	else 
		shadow = 1.0;	
	return shadow;
}

void main()
{
	vec4 final_color = ambientGlobal;
    vec4 specular_color = vec4(0.0,0.0,0.0,0.0);
	bool hasLight = false;
	vec3 n,halfV;
	vec4 diffuse;
	float NdotL,NdotHV;
	float att,spotEffect;
	float isLit,shadow;
	float depth, depthSqr;

	//Compute first all shadow variables
	//as : -Mac Os does not support accessing array of sampler2D with a non const index
	//     -Linux does not support accessing more than 1 time an element in an array (at compilation time)
	       
	       
#if MAX_NUMBER_OF_LIGHTS > 0
	 float shadowsVar[MAX_NUMBER_OF_LIGHTS];
	 for(int i=0 ; i<MAX_NUMBER_OF_LIGHTS ; i++)
	 	shadowsVar[i] = 1.0;
	 	
	 if(lightFlag[0] == 2)
	 	shadowsVar[0] = shadow_unroll(0, shadowTexture[0]);
#if MAX_NUMBER_OF_LIGHTS > 1
	 if(lightFlag[1] == 2)
	 	shadowsVar[1] = shadow_unroll(1, shadowTexture[1]);
#endif //MAX_NUMBER_OF_LIGHTS > 1
#if MAX_NUMBER_OF_LIGHTS > 2
	 if(lightFlag[2] == 2)
	 	shadowsVar[2] = shadow_unroll(2, shadowTexture[2]);
#endif //MAX_NUMBER_OF_LIGHTS > 2
#if MAX_NUMBER_OF_LIGHTS > 3
	 if(lightFlag[3] == 2)
	 	shadowsVar[3] = shadow_unroll(3, shadowTexture[3]);
#endif //MAX_NUMBER_OF_LIGHTS > 3
#if MAX_NUMBER_OF_LIGHTS > 4
	 if(lightFlag[4] == 2)
	 	shadowsVar[4] = shadow_unroll(4, shadowTexture[4]);
#endif //MAX_NUMBER_OF_LIGHTS > 4
#endif //MAX_NUMBER_OF_LIGHTS > 0

	// a fragment shader can't write a verying variable, hence we need
	//a new variable to store the normalized interpolated normal

	n = normalize(normal);
	for(int i=0 ; i<MAX_NUMBER_OF_LIGHTS ;i++)
	{
		if(lightFlag[i] > 0)
		{
			hasLight = true;
			shadow = shadowsVar[i];

			NdotL = max(dot(n,normalize(lightDir[i])),0.0);
			if (NdotL > 0.0 && shadow > 0.0)
			{
				diffuse = gl_FrontMaterial.diffuse * gl_LightSource[i].diffuse;
				spotEffect = dot(normalize(gl_LightSource[i].spotDirection), normalize(-lightDir[i]));

				if (spotEffect > gl_LightSource[i].spotCosCutoff)
				{
					spotEffect = shadow * smoothstep(gl_LightSource[i].spotCosCutoff, 1.0, spotEffect); //pow(spotEffect, gl_LightSource[0].spotExponent);
					att = spotEffect /* / (gl_LightSource[i].constantAttenuation +
							gl_LightSource[i].linearAttenuation * dist[i] +
							gl_LightSource[i].quadraticAttenuation * dist[i] * dist[i]) */;

					final_color += att * (diffuse * NdotL) ;

					halfV = normalize(gl_LightSource[i].halfVector.xyz);
					NdotHV = max(dot(n,halfV),0.0);
					specular_color += att * gl_FrontMaterial.specular * gl_LightSource[i].specular * pow(NdotHV,gl_FrontMaterial.shininess);
				}
			}
		}
	}

#ifdef USE_TEXTURE
	final_color.rgb *= texture2D(colorTexture,gl_TexCoord[0].st).rgb;
#endif

	final_color.rgb += specular_color.rgb;

	if (hasLight)
		gl_FragColor = final_color;
	else
		gl_FragColor = gl_Color;


	//gl_FragColor = shadow2DProj(shadowTexture[0], shadowTexCoord[0]);
	//gl_FragColor = shadowTexCoord[0]*0.5 - 0.5;

}
