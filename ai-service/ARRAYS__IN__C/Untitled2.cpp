// _________Linear search____________
#include<stdio.h>
int main()
{
	int ar[11],i,sr,count=0;
	printf("Enter the data in array");
	for(i=0;i<10;i++)	
	{
		scanf("%d",&ar[i]);
	}
	printf("Enter the data to search\n");
	scanf("%d",&sr);
	for(i=0;i<10;i++)
	{
		if(ar[i]==sr)		
		{
			count++;
		}
	}
	if(count>0)
		printf("sr exist %d times",count);
	else
ar[10] = sr;
}
